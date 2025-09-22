import { randomUUID } from 'crypto';
import localforage from 'localforage';
import CryptoJS from 'crypto-js';

export const DEFAULT_PAYLOAD_VERSION = '1.0.0';

export interface PersistenceConfig {
  formId: string;
  schemaVersion: string;
  userId?: string;
  encryptionKey?: string;
  ttlDays?: number;
  sensitivity?: 'low' | 'medium' | 'high';
  allowAutosave?: boolean;
  payloadVersion?: string;
}

export interface SaveOptions {
  manual?: boolean;
  immediate?: boolean;
}

export interface DraftMetadata {
  createdAt: string;
  updatedAt: string;
  expiresAt?: string;
  deviceId: string;
  sessionId: string;
  saveCount: number;
  isComplete: boolean;
  isEncrypted: boolean;
  hasConflicts?: boolean;
  conflictFields?: string[];
  userId?: string;
}

export interface DraftData {
  formId: string;
  schemaVersion: string;
  payloadVersion: string;
  data: unknown;
  currentStep: string;
  completedSteps: string[];
  metadata: DraftMetadata;
}

const DEVICE_STORAGE_KEY = 'cml-form-device-id';

export interface StoredDraft {
  key: string;
  draft: DraftData;
}

export class PersistenceManager {
  private store: ReturnType<typeof localforage.createInstance>;
  private config: PersistenceConfig;
  private saveQueue: Map<string, any> = new Map();
  private saveTimer: NodeJS.Timeout | null = null;
  private encryptionKey: string | null;
  private cleanupTimer: NodeJS.Timeout | null = null;
  private payloadVersion: string;

  constructor(config: PersistenceConfig) {
    this.config = config;
    this.encryptionKey = config.encryptionKey || null;
    this.payloadVersion = config.payloadVersion ?? DEFAULT_PAYLOAD_VERSION;
    this.store = localforage.createInstance({
      name: 'FormBuilder',
      storeName: 'drafts',
    });
    this.initialize();
  }

  async saveDraft(
    data: unknown,
    currentStep: string,
    completedSteps: string[],
    options?: SaveOptions,
  ): Promise<void> {
    if (!this.config.allowAutosave && !options?.manual) {
      return;
    }

    if (this.config.sensitivity === 'high' && !this.encryptionKey) {
      console.warn('High sensitivity data requires encryption. Draft not persisted.');
      return;
    }

    const key = this.getDraftKey();
    this.saveQueue.set(key, {
      data,
      currentStep,
      completedSteps,
      timestamp: Date.now(),
    });

    if (this.saveTimer) {
      clearTimeout(this.saveTimer);
    }

    this.saveTimer = setTimeout(() => void this.flushQueue(), options?.immediate ? 0 : 500);
  }

  async loadDraft(): Promise<DraftData | null> {
    const key = this.getDraftKey();
    const draft = (await this.store.getItem(key)) as DraftData | null;
    if (!draft) {
      return null;
    }

    if (this.isExpired(draft)) {
      await this.store.removeItem(key);
      return null;
    }

    if (draft.metadata.isEncrypted && typeof draft.data === 'string' && this.encryptionKey) {
      const bytes = CryptoJS.AES.decrypt(draft.data, this.encryptionKey);
      const decrypted = bytes.toString(CryptoJS.enc.Utf8);
      try {
        draft.data = JSON.parse(decrypted);
      } catch (error) {
        console.error('Failed to decrypt draft', error);
        return null;
      }
    }

    if (this.isCompressed(draft.data)) {
      draft.data = await this.decompress(draft.data as string);
    }

    return draft;
  }

  async deleteDraft(): Promise<void> {
    await this.store.removeItem(this.getDraftKey());
  }

  async deleteDraftByKey(key: string): Promise<void> {
    await this.store.removeItem(key);
  }

  async getAllDrafts(): Promise<StoredDraft[]> {
    const drafts: StoredDraft[] = [];

    await this.store.iterate((value: unknown, key: string) => {
      const draft = value as DraftData | null;
      if (!draft || this.isExpired(draft)) {
        return;
      }

      drafts.push({ key, draft });
    });

    return drafts;
  }

  async flushPendingSaves(): Promise<void> {
    if (this.saveTimer) {
      clearTimeout(this.saveTimer);
      this.saveTimer = null;
    }

    await this.flushQueue();
  }

  getPayloadVersion(): string {
    return this.payloadVersion;
  }

  private async initialize(): Promise<void> {
    await this.store.ready();
    await this.cleanExpiredDrafts();
    this.cleanupTimer = setInterval(
      () => {
        void this.cleanExpiredDrafts();
      },
      60 * 60 * 1000,
    );
  }

  private async flushQueue(): Promise<void> {
    const entries = Array.from(this.saveQueue.entries());
    this.saveQueue.clear();

    for (const [key, payload] of entries) {
      try {
        await this.persistDraft(key, payload);
      } catch (error) {
        console.error('Failed to persist draft', error);
        this.saveQueue.set(key, payload);
      }
    }
  }

  private async persistDraft(key: string, payload: any): Promise<void> {
    const existing = (await this.store.getItem(key)) as DraftData | null;
    const timestamp = new Date().toISOString();

    let data = payload.data;
    let isEncrypted = false;

    if (this.shouldEncrypt()) {
      data = CryptoJS.AES.encrypt(JSON.stringify(payload.data), this.encryptionKey!).toString();
      isEncrypted = true;
    }

    if (!isEncrypted && this.shouldCompress(payload.data)) {
      data = await this.compress(payload.data);
    }

    const draft: DraftData = {
      formId: this.config.formId,
      schemaVersion: this.config.schemaVersion,
      payloadVersion: this.payloadVersion,
      data,
      currentStep: payload.currentStep,
      completedSteps: payload.completedSteps,
      metadata: {
        createdAt: existing?.metadata.createdAt ?? timestamp,
        updatedAt: timestamp,
        expiresAt: this.getExpiryDate(),
        deviceId: await this.getDeviceId(),
        sessionId: this.getSessionId(),
        saveCount: (existing?.metadata.saveCount ?? 0) + 1,
        isComplete: false,
        isEncrypted,
        userId: this.config.userId,
      },
    };

    await this.store.setItem(key, draft);
    this.emitSaveEvent(draft);
  }

  private shouldEncrypt(): boolean {
    return Boolean(this.encryptionKey) && this.config.sensitivity !== 'low';
  }

  private async cleanExpiredDrafts(): Promise<void> {
    const keysToDelete: string[] = [];

    await this.store.iterate((value: DraftData | null, key: string) => {
      if (value && this.isExpired(value)) {
        keysToDelete.push(key);
      }
    });

    await Promise.all(keysToDelete.map((storageKey) => this.store.removeItem(storageKey)));
  }

  private getDraftKey(): string {
    const suffix = this.config.userId ? `:${this.config.userId}` : '';
    return `${this.config.formId}:${this.config.schemaVersion}${suffix}`;
  }

  private getExpiryDate(): string | undefined {
    if (!this.config.ttlDays) {
      return undefined;
    }
    const expiry = new Date();
    expiry.setDate(expiry.getDate() + this.config.ttlDays);
    return expiry.toISOString();
  }

  private isExpired(draft: DraftData): boolean {
    if (!draft?.metadata?.expiresAt) {
      return false;
    }

    return new Date(draft.metadata.expiresAt) < new Date();
  }

  private shouldCompress(data: unknown): boolean {
    try {
      const json = JSON.stringify(data ?? {});
      const encoder = typeof TextEncoder !== 'undefined' ? new TextEncoder() : null;
      const size = encoder ? encoder.encode(json).length : Buffer.from(json).length;
      return size > 50 * 1024;
    } catch {
      return false;
    }
  }

  private async compress(data: unknown): Promise<string> {
    const json = JSON.stringify(data ?? {});

    if (typeof CompressionStream !== 'undefined') {
      const stream = new CompressionStream('gzip');
      const writer = stream.writable.getWriter();
      const encoder = new TextEncoder();
      await writer.write(encoder.encode(json));
      await writer.close();
      const compressed = await new Response(stream.readable).arrayBuffer();
      const bytes = new Uint8Array(compressed);
      return `gz:${this.encodeBase64FromBytes(bytes)}`;
    }

    return `b64:${this.encodeBase64FromString(json)}`;
  }

  private async decompress(serialized: string): Promise<unknown> {
    if (serialized.startsWith('gz:')) {
      const payload = this.decodeBase64ToBytes(serialized.slice(3));
      if (typeof DecompressionStream !== 'undefined') {
        const stream = new DecompressionStream('gzip');
        const writer = stream.writable.getWriter();
        await writer.write(payload);
        await writer.close();
        const text = await new Response(stream.readable).text();
        return JSON.parse(text);
      }
    }

    const base64 = serialized.startsWith('b64:') ? serialized.slice(4) : serialized;
    const text = this.decodeBase64ToString(base64);
    return JSON.parse(text);
  }

  private isCompressed(data: unknown): data is string {
    return typeof data === 'string' && (data.startsWith('gz:') || data.startsWith('b64:'));
  }

  private encodeBase64FromBytes(bytes: Uint8Array): string {
    if (typeof btoa === 'function') {
      let binary = '';
      bytes.forEach((byte) => {
        binary += String.fromCharCode(byte);
      });
      return btoa(binary);
    }

    if (typeof Buffer !== 'undefined') {
      return Buffer.from(bytes).toString('base64');
    }

    return Array.from(bytes)
      .map((byte) => byte.toString(16).padStart(2, '0'))
      .join('');
  }

  private encodeBase64FromString(value: string): string {
    if (typeof btoa === 'function') {
      return btoa(value);
    }

    if (typeof Buffer !== 'undefined') {
      return Buffer.from(value, 'utf-8').toString('base64');
    }

    return value;
  }

  private decodeBase64ToBytes(value: string): Uint8Array {
    if (typeof atob === 'function') {
      const binary = atob(value);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i += 1) {
        bytes[i] = binary.charCodeAt(i);
      }
      return bytes;
    }

    if (typeof Buffer !== 'undefined') {
      return new Uint8Array(Buffer.from(value, 'base64'));
    }

    return new Uint8Array();
  }

  private decodeBase64ToString(value: string): string {
    if (typeof atob === 'function') {
      return atob(value);
    }

    if (typeof Buffer !== 'undefined') {
      return Buffer.from(value, 'base64').toString('utf-8');
    }

    return value;
  }

  private async getDeviceId(): Promise<string> {
    const globalStore = localforage.createInstance({ name: 'FormBuilderMeta', storeName: 'meta' });
    const existing = (await globalStore.getItem(DEVICE_STORAGE_KEY)) as string | null;
    if (existing) return existing;
    const id =
      typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
        ? crypto.randomUUID()
        : randomUUID();
    await globalStore.setItem(DEVICE_STORAGE_KEY, id);
    return id;
  }

  private getSessionId(): string {
    if (typeof window === 'undefined') {
      return 'server';
    }
    if (!window.sessionStorage.getItem('cml-form-session')) {
      const id =
        typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
          ? crypto.randomUUID()
          : randomUUID();
      window.sessionStorage.setItem('cml-form-session', id);
    }
    return window.sessionStorage.getItem('cml-form-session')!;
  }

  private emitSaveEvent(draft: DraftData): void {
    if (typeof window === 'undefined') {
      return;
    }

    const event = new CustomEvent('formDraftSaved', {
      detail: {
        formId: draft.formId,
        saveCount: draft.metadata.saveCount,
        timestamp: draft.metadata.updatedAt,
      },
    });

    window.dispatchEvent(event);
  }
}
