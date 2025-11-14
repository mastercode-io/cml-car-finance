export declare const DEFAULT_PAYLOAD_VERSION = "1.0.0";
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
export interface StoredDraft {
    key: string;
    draft: DraftData;
}
export declare class PersistenceManager {
    private store;
    private config;
    private saveQueue;
    private saveTimer;
    private encryptionKey;
    private cleanupTimer;
    private payloadVersion;
    constructor(config: PersistenceConfig);
    saveDraft(data: unknown, currentStep: string, completedSteps: string[], options?: SaveOptions): Promise<void>;
    loadDraft(): Promise<DraftData | null>;
    deleteDraft(): Promise<void>;
    deleteDraftByKey(key: string): Promise<void>;
    getAllDrafts(): Promise<StoredDraft[]>;
    flushPendingSaves(): Promise<void>;
    getPayloadVersion(): string;
    private initialize;
    private flushQueue;
    private persistDraft;
    private shouldEncrypt;
    private cleanExpiredDrafts;
    private getDraftKey;
    private getExpiryDate;
    private isExpired;
    private shouldCompress;
    private compress;
    private decompress;
    private isCompressed;
    private encodeBase64FromBytes;
    private encodeBase64FromString;
    private decodeBase64ToBytes;
    private decodeBase64ToString;
    private getDeviceId;
    private getSessionId;
    private emitSaveEvent;
}
//# sourceMappingURL=PersistenceManager.d.ts.map