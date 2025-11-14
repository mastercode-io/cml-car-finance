import type { DraftData } from './PersistenceManager';
export declare class ConflictResolver {
    static resolveConflicts(localDraft: DraftData, remoteDraft: DraftData): Promise<DraftData>;
    private static detectConflicts;
    private static mergeData;
}
//# sourceMappingURL=ConflictResolver.d.ts.map