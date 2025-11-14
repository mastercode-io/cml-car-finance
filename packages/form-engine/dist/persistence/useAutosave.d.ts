export interface UseAutosaveOptions {
    enabled?: boolean;
    interval?: number;
    onSave?: () => void;
    onError?: (error: Error) => void;
    sensitivity?: 'low' | 'medium' | 'high';
    ttlDays?: number;
    userId?: string;
    encryptionKey?: string;
}
export interface AutosaveState {
    lastSaved: Date | null;
    isSaving: boolean;
    saveCount: number;
    error: Error | null;
}
export interface AutosaveControls extends AutosaveState {
    saveDraft: () => Promise<void>;
    clearDraft: () => Promise<void>;
    loadDraft: () => Promise<void>;
}
export declare function useAutosave(formId: string, schemaVersion: string, formData: unknown, currentStep: string, completedSteps: string[], options?: UseAutosaveOptions): AutosaveControls;
//# sourceMappingURL=useAutosave.d.ts.map