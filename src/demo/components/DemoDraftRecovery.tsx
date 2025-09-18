'use client';

import { useMemo } from 'react';
import { Info } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

import type { DraftData } from '@form-engine/index';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

interface DemoDraftRecoveryProps {
  draft: DraftData;
  onRecover: (draft: DraftData) => void;
  onDiscard: (draft: DraftData) => void;
}

export const DemoDraftRecovery = ({ draft, onRecover, onDiscard }: DemoDraftRecoveryProps) => {
  const draftAge = useMemo(() => {
    return formatDistanceToNow(new Date(draft.metadata.updatedAt), {
      addSuffix: true,
    });
  }, [draft.metadata.updatedAt]);

  return (
    <Alert className="border-blue-200 bg-blue-50 text-blue-900">
      <AlertTitle className="flex items-center gap-2 text-blue-900">
        <Info aria-hidden className="h-4 w-4" />
        Unsaved draft detected
      </AlertTitle>
      <AlertDescription className="space-y-3">
        <p>
          We found a draft saved {draftAge}. You can continue from where you left off or start a
          fresh application.
        </p>
        <div className="flex flex-wrap gap-2 text-sm">
          <span className="rounded bg-blue-100 px-2 py-1 font-medium">
            Step: {draft.currentStep}
          </span>
          <span className="rounded bg-blue-100 px-2 py-1 font-medium">
            Progress: {draft.completedSteps.length} completed
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" onClick={() => onRecover(draft)}>
            Recover draft
          </Button>
          <Button variant="outline" size="sm" onClick={() => onDiscard(draft)}>
            Start over
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
};
