'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';

import {
  FormRenderer,
  PerformanceDashboard,
  PersistenceManager,
  type DraftData,
  useFormAnalytics,
} from '@form-engine/index';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';

import { DemoDraftRecovery } from './components/DemoDraftRecovery';
import { demoFormSchema } from './DemoFormSchema';

const AUTOSAVE_INTERVAL = 5000;
const INITIAL_STEP = demoFormSchema.steps[0]?.id ?? 'personal';

type AutosaveState = {
  isSaving: boolean;
  lastSavedAt: number | null;
  saveCount: number;
};

const createInitialAutosaveState = (): AutosaveState => ({
  isSaving: false,
  lastSavedAt: null,
  saveCount: 0,
});

const isSafeSegment = (segment: string): boolean => {
  return segment !== '__proto__' && segment !== 'constructor' && segment !== 'prototype';
};

const applyValueAtPath = (
  data: Record<string, unknown>,
  path: string,
  value: unknown,
): Record<string, unknown> => {
  if (!path) {
    return value === undefined ? data : { ...data };
  }

  const segments = path
    .replace(/\[(\d+)\]/g, '.$1')
    .split('.')
    .filter(Boolean);
  if (segments.some((segment) => !isSafeSegment(segment))) {
    return data;
  }

  const next = { ...data };
  let cursor: Record<string, unknown> | unknown[] = next;

  segments.slice(0, -1).forEach((segment, index) => {
    const nextSegment = segments[index + 1];
    if (Array.isArray(cursor)) {
      const arrayCursor = cursor as unknown[];
      const indexKey = Number(segment);
      if (Number.isNaN(indexKey)) {
        return;
      }
      const existing = arrayCursor[indexKey];
      let updated: unknown;
      if (Array.isArray(existing)) {
        updated = [...existing];
      } else if (existing && typeof existing === 'object') {
        updated = { ...(existing as Record<string, unknown>) };
      } else {
        updated = nextSegment && /^\d+$/.test(nextSegment) ? [] : {};
      }
      arrayCursor[indexKey] = updated;
      cursor = updated as Record<string, unknown> | unknown[];
      return;
    }

    const recordCursor = cursor as Record<string, unknown>;
    const existing = recordCursor[segment];
    let updated: unknown;
    if (Array.isArray(existing)) {
      updated = [...existing];
    } else if (existing && typeof existing === 'object') {
      updated = { ...(existing as Record<string, unknown>) };
    } else {
      updated = nextSegment && /^\d+$/.test(nextSegment) ? [] : {};
    }
    recordCursor[segment] = updated;
    cursor = updated as Record<string, unknown> | unknown[];
  });

  const lastKey = segments[segments.length - 1];
  if (!lastKey) {
    return next;
  }

  if (Array.isArray(cursor)) {
    const index = Number(lastKey);
    if (Number.isNaN(index)) {
      return next;
    }
    if (value === undefined || value === null) {
      (cursor as unknown[]).splice(index, 1);
    } else {
      (cursor as unknown[])[index] = value as never;
    }
    return next;
  }

  if (value === undefined || value === null) {
    delete (cursor as Record<string, unknown>)[lastKey];
  } else {
    (cursor as Record<string, unknown>)[lastKey] = value;
  }

  return next;
};

const formatLastSaved = (state: AutosaveState): string => {
  if (state.isSaving) {
    return 'Saving draft…';
  }
  if (state.lastSavedAt) {
    return `Last saved ${formatDistanceToNow(state.lastSavedAt, { addSuffix: true })}`;
  }
  return 'Autosave pending';
};

export const DemoForm = () => {
  const [formInstanceKey, setFormInstanceKey] = useState(0);
  const [initialData, setInitialData] = useState<Record<string, unknown> | undefined>(undefined);
  const [formData, setFormData] = useState<Record<string, unknown>>({});
  const [currentStep, setCurrentStep] = useState<string>(INITIAL_STEP);
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);
  const [draft, setDraft] = useState<DraftData | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [showPerformance, setShowPerformance] = useState(false);
  const [autosaveState, setAutosaveState] = useState<AutosaveState>(createInitialAutosaveState);
  const [submittedData, setSubmittedData] = useState<Record<string, unknown> | null>(null);
  const [showResults, setShowResults] = useState(false);

  const persistenceRef = useRef<PersistenceManager | null>(null);
  const autosaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const previousStepRef = useRef<string>(INITIAL_STEP);

  const analytics = useFormAnalytics(demoFormSchema.$id, demoFormSchema.version, {
    enabled: true,
    sampling: 1,
    sensitive: true,
    performanceBudgets: {
      stepTransition: 150,
      validation: 60,
      initialLoad: 400,
    },
  });

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const manager = new PersistenceManager({
      formId: demoFormSchema.$id,
      schemaVersion: demoFormSchema.version,
      allowAutosave: true,
      sensitivity: demoFormSchema.metadata.sensitivity,
    });

    persistenceRef.current = manager;
    let mounted = true;

    manager
      .loadDraft()
      .then((loadedDraft) => {
        if (!mounted) {
          return;
        }
        if (loadedDraft) {
          setDraft(loadedDraft);
        }
      })
      .catch((error) => {
        console.error('Failed to load draft', error);
      })
      .finally(() => {
        if (mounted) {
          setIsReady(true);
        }
      });

    return () => {
      mounted = false;
      persistenceRef.current = null;
    };
  }, []);

  useEffect(() => {
    return () => {
      if (autosaveTimeoutRef.current) {
        clearTimeout(autosaveTimeoutRef.current);
        autosaveTimeoutRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!isReady || !persistenceRef.current) {
      return;
    }

    if (autosaveTimeoutRef.current) {
      clearTimeout(autosaveTimeoutRef.current);
    }

    autosaveTimeoutRef.current = setTimeout(() => {
      const manager = persistenceRef.current;
      if (!manager) {
        return;
      }

      setAutosaveState((prev) => ({ ...prev, isSaving: true }));

      manager
        .saveDraft(formData, currentStep, completedSteps)
        .then(() => manager.flushPendingSaves())
        .then(() => {
          setAutosaveState((prev) => ({
            isSaving: false,
            lastSavedAt: Date.now(),
            saveCount: prev.saveCount + 1,
          }));
        })
        .catch((error) => {
          console.error('Failed to persist draft', error);
          setAutosaveState((prev) => ({ ...prev, isSaving: false }));
        });
    }, AUTOSAVE_INTERVAL);

    return () => {
      if (autosaveTimeoutRef.current) {
        clearTimeout(autosaveTimeoutRef.current);
        autosaveTimeoutRef.current = null;
      }
    };
  }, [completedSteps, currentStep, formData, isReady]);

  const handleFieldChange = useCallback(
    (field: string, value: unknown) => {
      setFormData((prev) => applyValueAtPath(prev, field, value));
      analytics.trackFieldInteraction(field, value, 'change');
    },
    [analytics],
  );

  const handleStepChange = useCallback(
    (nextStep: string) => {
      const previous = previousStepRef.current;
      if (previous && previous !== nextStep) {
        const measure = analytics.measureStepTransition(previous, nextStep);
        measure?.();
        setCompletedSteps((prev) => (prev.includes(previous) ? prev : [...prev, previous]));
      }
      analytics.trackStepView(nextStep);
      previousStepRef.current = nextStep;
      setCurrentStep(nextStep);
    },
    [analytics],
  );

  const handleValidationError = useCallback(
    (errors: unknown) => {
      const step = previousStepRef.current ?? currentStep;
      analytics.trackValidation(step, (errors as Record<string, unknown>) ?? {}, false);
    },
    [analytics, currentStep],
  );

  const resetFormState = useCallback(() => {
    setFormInstanceKey((key) => key + 1);
    setInitialData(undefined);
    setFormData({});
    setCompletedSteps([]);
    setCurrentStep(INITIAL_STEP);
    previousStepRef.current = INITIAL_STEP;
    setAutosaveState(createInitialAutosaveState());
  }, []);

  const handleSubmit = useCallback(
    async (data: Record<string, unknown>) => {
      try {
        await new Promise((resolve) => setTimeout(resolve, 800));
        analytics.trackValidation('submission', {}, true);
        analytics.trackSubmission(true, data);
        setSubmittedData(data);
        setShowResults(true);
        toast.success('Application submitted successfully', {
          description: 'Thank you for completing the demo application. We will be in touch soon.',
        });
        await persistenceRef.current?.deleteDraft();
        resetFormState();
      } catch (error) {
        analytics.trackSubmission(false, data, error as Error);
        toast.error('Unable to submit application', {
          description: (error as Error)?.message ?? 'Please try again shortly.',
        });
      }
    },
    [analytics, resetFormState],
  );

  const handleDraftRecover = useCallback((nextDraft: DraftData) => {
    const recoveredData = (nextDraft.data as Record<string, unknown>) ?? {};
    setInitialData(recoveredData);
    setFormData(recoveredData);
    setCompletedSteps(nextDraft.completedSteps);
    setCurrentStep(nextDraft.currentStep);
    previousStepRef.current = nextDraft.currentStep;
    setAutosaveState((prev) => ({
      ...prev,
      lastSavedAt: Date.parse(nextDraft.metadata.updatedAt) || Date.now(),
      saveCount: nextDraft.metadata.saveCount,
      isSaving: false,
    }));
    setDraft(null);
    toast.success('Draft recovered', {
      description: 'You can continue where you left off.',
    });
  }, []);

  const handleDraftDiscard = useCallback(async () => {
    try {
      await persistenceRef.current?.deleteDraft();
    } catch (error) {
      console.error('Failed to delete draft', error);
    }
    setDraft(null);
    resetFormState();
    toast.info('Draft discarded', {
      description: 'The saved draft has been removed.',
    });
  }, [resetFormState]);

  const sessionMetrics = analytics.getSessionMetrics();

  if (!isReady) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-32 w-96" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-4 rounded-lg border bg-white p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{demoFormSchema.metadata.title}</h1>
          <p className="text-sm text-slate-600">{demoFormSchema.metadata.description}</p>
        </div>
        <div className="flex flex-col items-start gap-3 sm:items-end">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary">Step: {currentStep}</Badge>
            <Badge variant="outline">Completed: {completedSteps.length}</Badge>
            <Badge variant="outline">{formatLastSaved(autosaveState)}</Badge>
          </div>
          <Button variant="outline" size="sm" onClick={() => setShowPerformance((value) => !value)}>
            {showPerformance ? 'Hide performance' : 'Show performance'}
          </Button>
        </div>
      </header>

      {draft ? (
        <DemoDraftRecovery
          draft={draft}
          onRecover={handleDraftRecover}
          onDiscard={handleDraftDiscard}
        />
      ) : null}

      <div className="rounded-lg border bg-white p-6 shadow-sm">
        <FormRenderer
          key={formInstanceKey}
          schema={demoFormSchema}
          initialData={initialData}
          onSubmit={handleSubmit}
          onStepChange={handleStepChange}
          onFieldChange={handleFieldChange}
          onValidationError={handleValidationError}
          className="space-y-6"
        />
      </div>

      {showPerformance ? <PerformanceDashboard show /> : null}

      <Dialog open={showResults} onOpenChange={setShowResults}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Application submitted</DialogTitle>
            <DialogDescription>
              We captured the form payload below so you can inspect what is sent through the engine.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 text-sm">
            <div className="rounded border border-emerald-200 bg-emerald-50 p-4 text-emerald-900">
              Submission succeeded in this session. The analytics session ID is{' '}
              <span className="font-mono text-xs">{analytics.getSessionId() ?? 'n/a'}</span>.
            </div>
            {sessionMetrics ? (
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <div>
                  <span className="text-slate-500">Started:</span>{' '}
                  {new Date(sessionMetrics.startTime).toLocaleTimeString()}
                </div>
                <div>
                  <span className="text-slate-500">Duration:</span>{' '}
                  {Math.round((sessionMetrics.endTime - sessionMetrics.startTime) / 1000)} seconds
                </div>
              </div>
            ) : null}
            <pre className="max-h-80 overflow-auto rounded bg-slate-900 p-4 text-xs text-slate-100">
              {JSON.stringify(submittedData, null, 2)}
            </pre>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
