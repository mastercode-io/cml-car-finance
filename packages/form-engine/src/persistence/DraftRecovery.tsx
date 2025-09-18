'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { AlertCircle } from 'lucide-react';

import { PersistenceManager, type DraftData, type StoredDraft } from './PersistenceManager';

interface DraftRecoveryProps {
  draft: DraftData;
  onRecover: (data: DraftData['data']) => void;
  onDiscard: () => void;
}

export const DraftRecovery: React.FC<DraftRecoveryProps> = ({ draft, onRecover, onDiscard }) => {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) {
    return null;
  }

  const timeSinceUpdate = useMemo(
    () =>
      formatDistanceToNow(new Date(draft.metadata.updatedAt), {
        addSuffix: true,
      }),
    [draft.metadata.updatedAt],
  );

  return (
    <div className="mb-4 rounded-md border border-yellow-300 bg-yellow-50 p-4 text-sm text-yellow-900">
      <div className="mb-2 flex items-center gap-2 font-semibold">
        <AlertCircle className="h-4 w-4" aria-hidden="true" />
        Unsaved Draft Found
      </div>
      <p className="mb-3">
        You have an unsaved draft from {timeSinceUpdate}. Would you like to continue where you left
        off?
      </p>
      <div className="flex gap-2">
        <button
          type="button"
          className="rounded bg-blue-600 px-3 py-1 text-white transition-colors hover:bg-blue-700"
          onClick={() => {
            onRecover(draft.data);
            setIsVisible(false);
          }}
        >
          Recover Draft
        </button>
        <button
          type="button"
          className="rounded border border-blue-600 px-3 py-1 text-blue-600 transition-colors hover:bg-blue-50"
          onClick={() => {
            onDiscard();
            setIsVisible(false);
          }}
        >
          Start Fresh
        </button>
      </div>
    </div>
  );
};

interface DraftManagementDialogProps {
  formId: string;
  onSelectDraft: (draft: DraftData, storageKey: string) => void;
}

export const DraftManagementDialog: React.FC<DraftManagementDialogProps> = ({
  formId,
  onSelectDraft,
}) => {
  const managerRef = useRef<PersistenceManager | null>(null);
  const [drafts, setDrafts] = useState<StoredDraft[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  if (!managerRef.current) {
    managerRef.current = new PersistenceManager({
      formId,
      schemaVersion: '*',
      allowAutosave: false,
    });
  }

  const loadDrafts = useCallback(async () => {
    setIsLoading(true);
    try {
      const manager = managerRef.current;
      if (!manager) {
        return;
      }
      const results = await manager.getAllDrafts();
      const filtered = results.filter(({ draft }) => draft.formId === formId);
      setDrafts(filtered);
    } catch (error) {
      console.error('Failed to load drafts', error);
    } finally {
      setIsLoading(false);
    }
  }, [formId]);

  useEffect(() => {
    void loadDrafts();
  }, [loadDrafts]);

  const handleDelete = useCallback(
    async (draft: StoredDraft) => {
      try {
        await managerRef.current?.deleteDraftByKey(draft.key);
        await loadDrafts();
      } catch (error) {
        console.error('Failed to delete draft', error);
      }
    },
    [loadDrafts],
  );

  if (isLoading) {
    return <div>Loading drafts...</div>;
  }

  if (drafts.length === 0) {
    return <div>No drafts found</div>;
  }

  return (
    <div className="space-y-3 rounded-md border border-slate-200 p-4">
      <h3 className="text-base font-semibold">Available Drafts</h3>
      {drafts.map((entry) => (
        <div key={entry.key} className="flex flex-col gap-3 rounded border border-slate-200 p-3">
          <div>
            <p className="font-medium">Version {entry.draft.schemaVersion}</p>
            <p className="text-xs text-slate-600">
              Last updated{' '}
              {formatDistanceToNow(new Date(entry.draft.metadata.updatedAt), {
                addSuffix: true,
              })}
            </p>
            <p className="text-xs text-slate-600">
              Progress: Step {entry.draft.currentStep} ({entry.draft.completedSteps.length}{' '}
              completed)
            </p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              className="rounded bg-slate-900 px-3 py-1 text-white transition-colors hover:bg-slate-700"
              onClick={() => onSelectDraft(entry.draft, entry.key)}
            >
              Load
            </button>
            <button
              type="button"
              className="rounded border border-slate-900 px-3 py-1 text-slate-900 transition-colors hover:bg-slate-100"
              onClick={() => void handleDelete(entry)}
            >
              Delete
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};
