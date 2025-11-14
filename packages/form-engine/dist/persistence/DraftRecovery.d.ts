import { type DraftData } from './PersistenceManager';
interface DraftRecoveryProps {
    draft: DraftData;
    onRecover: (data: DraftData['data']) => void;
    onDiscard: () => void;
}
export declare const DraftRecovery: React.FC<DraftRecoveryProps>;
interface DraftManagementDialogProps {
    formId: string;
    onSelectDraft: (draft: DraftData, storageKey: string) => void;
}
export declare const DraftManagementDialog: React.FC<DraftManagementDialogProps>;
export {};
//# sourceMappingURL=DraftRecovery.d.ts.map