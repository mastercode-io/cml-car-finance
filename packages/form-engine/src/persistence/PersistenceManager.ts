import { randomUUID } from 'crypto';
import localforage from 'localforage';
import CryptoJS from 'crypto-js';

export interface PersistenceConfig {
  formId: string;
  schemaVersion: string;
  userId?: string;
  encryptionKey?: string;
  ttlDays?: number;
  sensitivity?: 'low' | 'medium' | 'high';
  allowAutosave?: boolean;
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

export class PersistenceManager {
  private store: ReturnType<typeof localforage.createInstance>;
  private config: PersistenceConfig;
  private saveQueue: Map<string, any> = new Map();
  private saveTimer: NodeJS.Timeout | null = null;
  private encryptionKey: string | null;

  constructor(config: PersistenceConfig) {
    this.config = config;
    this.encryptionKey = config.encryptionKey || null;
    this.store = localforage.createInstance({
      name: 'FormBuilder',
      storeName: 'drafts'
    });
    this.initialize();
  }

  async saveDraft(data: unknown, currentStep: string, completedSteps: string[], options?: SaveOptions): Promise<void> {
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
      timestamp: Date.now()
    });

    if (this.saveTimer) {
      clearTimeout(this.saveTimer);
    }

    this.saveTimer = setTimeout(() => void this.flushQueue(), options?.immediate ? 0 : 500);
  }

  async loadDraft(): Promise<DraftData | null> {
    const key = this.getDraftKey();
    const draft = await this.store.getItem<DraftData>(key);
    if (!draft) {
      return null;
    }

    if (draft.metadata.expiresAt && new Date(draft.metadata.expiresAt) < new Date()) {
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

    return draft;
  }

  async deleteDraft(): Promise<void> {
    await this.store.removeItem(this.getDraftKey());
  }

  private async initialize(): Promise<void> {
    await this.store.ready();
    await this.cleanExpiredDrafts();
  }

  private async flushQueue(): Promise<void> {
    const entries = Array.from(this.saveQueue.entries());
    this.saveQueue.clear();

    for (const [key, payload] of entries) {
      try {
        await this.persistDraft(key, payload);
      } catch (error) {
        console.error('Failed to persist draft', error);
      }
    }
  }

  private async persistDraft(key: string, payload: any): Promise<void> {
    const existing = await this.store.getItem<DraftData>(key);
    const timestamp = new Date().toISOString();

    let data = payload.data;
    let isEncrypted = false;

    if (this.shouldEncrypt()) {
      data = CryptoJS.AES.encrypt(JSON.stringify(payload.data), this.encryptionKey!).toString();
      isEncrypted = true;
    }

    const draft: DraftData = {
      formId: this.config.formId,
      schemaVersion: this.config.schemaVersion,
      payloadVersion: '1.0.0',
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
        isEncrypted
      }
    };

    await this.store.setItem(key, draft);
  }

  private shouldEncrypt(): boolean {
    return Boolean(this.encryptionKey) && this.config.sensitivity !== 'low';
  }

  private async cleanExpiredDrafts(): Promise<void> {
    await this.store.iterate<DraftData, void>(async (value: DraftData, key: string) => {
      if (value.metadata.expiresAt && new Date(value.metadata.expiresAt) < new Date()) {
        await this.store.removeItem(key);
      }
    });
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

  private async getDeviceId(): Promise<string> {
    const globalStore = localforage.createInstance({ name: 'FormBuilderMeta', storeName: 'meta' });
    const existing = await globalStore.getItem<string>(DEVICE_STORAGE_KEY);
    if (existing) return existing;
    const id = typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function' ? crypto.randomUUID() : randomUUID();
    await globalStore.setItem(DEVICE_STORAGE_KEY, id);
    return id;
  }

  private getSessionId(): string {
    if (typeof window === 'undefined') {
      return 'server';
    }
    if (!window.sessionStorage.getItem('cml-form-session')) {
      const id = typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function' ? crypto.randomUUID() : randomUUID();
      window.sessionStorage.setItem('cml-form-session', id);
    }
    return window.sessionStorage.getItem('cml-form-session')!;
  }
}
