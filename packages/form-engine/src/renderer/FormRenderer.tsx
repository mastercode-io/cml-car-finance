'use client';

import * as React from 'react';
import { FormProvider, useForm } from 'react-hook-form';

import { FieldFactory } from '../components/fields/FieldFactory';
import { FeaturesProvider, useFlag } from '../context/features';
import type { JSONSchema, UnifiedFormSchema, ValidationError, WidgetType } from '../types';
import { TransitionEngine } from '../rules/transition-engine';
import { VisibilityController } from '../rules/visibility-controller';
import { ValidationEngine } from '../validation/ajv-setup';
import { createAjvResolver } from '../validation/rhf-resolver';
import { cn } from '../utils/cn';
import type { PersistenceManager } from '../persistence/PersistenceManager';

import { ErrorSummary } from './ErrorSummary';
import { StepProgress } from './StepProgress';
import {
  flattenFieldErrors,
  getStepFieldNames,
  getStepStatus,
  resolveStepSchema,
  scrollToFirstError,
} from './utils';
import { useResolvedValidation, useValidationStrategyEffects } from './useValidation';

const formatDuration = (ms: number): string => {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return [hours, minutes, seconds].map((value) => value.toString().padStart(2, '0')).join(':');
  }

  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

type SubmissionSummaryOptions = {
  schema: UnifiedFormSchema;
  visibleSteps: string[];
  retainHidden: boolean;
  visibilityController: VisibilityController;
};

const buildSubmissionSummary = (
  values: Record<string, unknown>,
  { schema, visibleSteps, retainHidden, visibilityController }: SubmissionSummaryOptions,
): Record<string, unknown> => {
  const sanitizedValues = { ...values };
  delete sanitizedValues._meta;

  if (retainHidden) {
    return sanitizedValues;
  }

  const schemaFields = new Set<string>();
  schema.steps.forEach((step) => {
    const stepSchema = resolveStepSchema(step, schema);
    Object.keys(stepSchema.properties ?? {}).forEach((field) => {
      schemaFields.add(field);
    });
  });

  const visibleFieldSet = new Set<string>();
  visibleSteps.forEach((stepId) => {
    visibilityController
      .getVisibleFields(schema, stepId, sanitizedValues)
      .forEach((field) => visibleFieldSet.add(field));
  });

  const summary: Record<string, unknown> = {};
  Object.keys(sanitizedValues).forEach((key) => {
    if (visibleFieldSet.has(key) || !schemaFields.has(key)) {
      summary[key] = sanitizedValues[key];
    }
  });

  return summary;
};

export interface FormRendererProps {
  schema: UnifiedFormSchema;
  initialData?: Record<string, unknown>;
  onSubmit: (data: any) => void | Promise<void>;
  onStepChange?: (stepId: string) => void;
  onFieldChange?: (field: string, value: unknown) => void;
  onValidationError?: (errors: unknown) => void;
  mode?: 'create' | 'edit' | 'view';
  className?: string;
}

type StepValidationResult = {
  valid: boolean;
  failedStep?: string;
};

const FormRendererInner: React.FC<FormRendererProps> = ({
  schema,
  initialData,
  onSubmit,
  onStepChange,
  onFieldChange,
  onValidationError,
  mode = 'create',
  className,
}) => {
  const fallbackInitialDataRef = React.useRef<Record<string, unknown>>({});
  const resolvedInitialData = initialData ?? fallbackInitialDataRef.current;
  const validationEngineRef = React.useRef(new ValidationEngine());
  const visibilityControllerRef = React.useRef(new VisibilityController());
  const transitionEngineRef = React.useRef(new TransitionEngine());
  const currentStepSchemaRef = React.useRef<JSONSchema | undefined>(undefined);
  const persistenceRef = React.useRef<PersistenceManager | null>(null);
  const persistencePromiseRef = React.useRef<Promise<PersistenceManager | null> | null>(null);

  const { config: validationConfig, modes: validationModes } = useResolvedValidation(schema);
  const validationStrategy = validationConfig.strategy;
  const validationDebounceMs = validationConfig.debounceMs;
  const shouldValidateOnStepChange = validationModes.validateOnStepChange;

  const [currentStepIndex, setCurrentStepIndex] = React.useState(0);
  const [stepHistory, setStepHistory] = React.useState<string[]>([]);
  const [completedSteps, setCompletedSteps] = React.useState<string[]>([]);
  const [errorSteps, setErrorSteps] = React.useState<string[]>([]);
  const [isSubmitting, setSubmitting] = React.useState(false);
  const [submissionFeedback, setSubmissionFeedback] = React.useState<null | {
    type: 'info' | 'error';
    message: string;
  }>(null);
  const [sessionActionPending, setSessionActionPending] = React.useState<
    null | 'restart' | 'restore'
  >(null);

  const sessionTimeoutMs = React.useMemo(() => {
    const configuredTimeout = schema.metadata?.timeout;
    const minutes = typeof configuredTimeout === 'number' ? configuredTimeout : 30;
    if (!minutes || minutes <= 0) {
      return 0;
    }
    return minutes * 60 * 1000;
  }, [schema.metadata?.timeout]);

  const [sessionExpiresAt, setSessionExpiresAt] = React.useState<number | null>(() =>
    sessionTimeoutMs > 0 ? Date.now() + sessionTimeoutMs : null,
  );
  const [timeRemainingMs, setTimeRemainingMs] = React.useState<number | null>(() =>
    sessionTimeoutMs > 0 ? sessionTimeoutMs : null,
  );
  const [isSessionExpired, setSessionExpired] = React.useState(false);
  const submitInFlightRef = React.useRef(false);

  const resolver = React.useCallback(
    async (values: Record<string, unknown>, context: any, options: any) => {
      const schemaForStep = currentStepSchemaRef.current;
      if (!schemaForStep) {
        return {
          values,
          errors: {},
        };
      }

      const stepResolver = createAjvResolver(schemaForStep, validationEngineRef.current);
      return stepResolver(values, context, options);
    },
    [],
  );

  const methods = useForm({
    defaultValues: resolvedInitialData,
    resolver,
    mode: validationModes.mode,
    reValidateMode: validationModes.reValidateMode,
    shouldUnregister: false,
  });

  const flushPendingValidation = useValidationStrategyEffects(
    methods,
    validationStrategy,
    validationDebounceMs,
  );

  const { reset } = methods;

  React.useEffect(() => {
    reset(resolvedInitialData, {
      keepDirty: false,
      keepErrors: false,
      keepDefaultValues: false,
    });
  }, [reset, resolvedInitialData]);

  React.useEffect(() => {
    if (sessionTimeoutMs <= 0) {
      setSessionExpiresAt(null);
      setTimeRemainingMs(null);
      setSessionExpired(false);
      return;
    }

    setSessionExpiresAt(Date.now() + sessionTimeoutMs);
    setTimeRemainingMs(sessionTimeoutMs);
    setSessionExpired(false);
  }, [schema.$id, sessionTimeoutMs]);

  React.useEffect(() => {
    if (!sessionExpiresAt || isSessionExpired || typeof window === 'undefined') {
      return;
    }

    const updateRemaining = () => {
      const remaining = sessionExpiresAt - Date.now();
      if (remaining <= 0) {
        setSessionExpired(true);
        setTimeRemainingMs(0);
        setSubmissionFeedback({
          type: 'error',
          message:
            'Your session expired. Start a new session or restore a saved draft to continue.',
        });
        setSubmitting(false);
        return;
      }
      setTimeRemainingMs(remaining);
    };

    updateRemaining();

    const intervalId = window.setInterval(updateRemaining, 1000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [isSessionExpired, sessionExpiresAt]);

  const watchedValues = methods.watch();

  const visibleSteps = React.useMemo(() => {
    return visibilityControllerRef.current.getVisibleSteps(schema, watchedValues);
  }, [schema, watchedValues]);

  const sanitizedStepHistory = React.useMemo(
    () => stepHistory.filter((step) => visibleSteps.includes(step)),
    [stepHistory, visibleSteps],
  );
  React.useEffect(() => {
    if (sanitizedStepHistory.length !== stepHistory.length) {
      setStepHistory(sanitizedStepHistory);
    }
  }, [sanitizedStepHistory, stepHistory]);

  React.useEffect(() => {
    setCompletedSteps((prev) => prev.filter((step) => visibleSteps.includes(step)));
  }, [visibleSteps]);

  React.useEffect(() => {
    setErrorSteps((prev) => prev.filter((step) => visibleSteps.includes(step)));
  }, [visibleSteps]);

  const currentStepId = visibleSteps[currentStepIndex] ?? visibleSteps[0];
  const currentStepConfig = schema.steps.find((step) => step.id === currentStepId);
  const currentStepSchema = currentStepConfig
    ? resolveStepSchema(currentStepConfig, schema)
    : undefined;
  currentStepSchemaRef.current = currentStepSchema;

  React.useEffect(() => {
    if (currentStepConfig && onStepChange) {
      onStepChange(currentStepConfig.id);
    }
  }, [currentStepConfig, onStepChange]);

  React.useEffect(() => {
    const subscription = methods.watch((values, { name }) => {
      if (name && onFieldChange) {
        onFieldChange(name, values?.[name as keyof typeof values]);
      }
      visibilityControllerRef.current.clearCache();
    });
    return () => subscription.unsubscribe();
  }, [methods, onFieldChange]);

  React.useEffect(() => {
    if (methods.formState.errors && Object.keys(methods.formState.errors).length > 0) {
      onValidationError?.(methods.formState.errors);
    }
  }, [methods.formState.errors, onValidationError]);

  React.useEffect(() => {
    if (currentStepIndex >= visibleSteps.length && visibleSteps.length > 0) {
      setCurrentStepIndex(visibleSteps.length - 1);
    }
  }, [currentStepIndex, visibleSteps]);

  const stepFieldMap = React.useMemo(() => {
    return new Map(schema.steps.map((step) => [step.id, new Set(getStepFieldNames(step, schema))]));
  }, [schema]);

  const stepErrorsFromState = React.useMemo(() => {
    const flattened = flattenFieldErrors(methods.formState.errors);
    const stepsWithErrors = new Set<string>();
    flattened.forEach(({ name }) => {
      const rootField = name.split('.')[0];
      if (!rootField) {
        return;
      }
      for (const [stepId, fields] of stepFieldMap.entries()) {
        if (fields.has(rootField)) {
          stepsWithErrors.add(stepId);
          break;
        }
      }
    });
    return Array.from(stepsWithErrors);
  }, [methods.formState.errors, stepFieldMap]);

  React.useEffect(() => {
    setErrorSteps((prev) => {
      const unique = Array.from(new Set(stepErrorsFromState));
      if (unique.length === prev.length && unique.every((step) => prev.includes(step))) {
        return prev;
      }
      return unique;
    });
  }, [stepErrorsFromState]);

  const errorStepSet = React.useMemo(() => new Set(errorSteps), [errorSteps]);

  const ensurePersistenceManager = React.useCallback(async () => {
    if (typeof window === 'undefined') {
      return null;
    }

    if (persistenceRef.current) {
      return persistenceRef.current;
    }

    if (!persistencePromiseRef.current) {
      persistencePromiseRef.current = import('../persistence/PersistenceManager')
        .then(({ PersistenceManager: PersistenceManagerModule }) => {
          const manager = new PersistenceManagerModule({
            formId: schema.$id,
            schemaVersion: schema.version,
            allowAutosave: schema.metadata.allowAutosave !== false,
            sensitivity: schema.metadata.sensitivity,
          });
          persistenceRef.current = manager;
          return manager;
        })
        .catch((error) => {
          console.error('Failed to initialize persistence manager', error);
          return null;
        });
    }

    const manager = await persistencePromiseRef.current;
    if (!manager) {
      persistencePromiseRef.current = null;
    }
    return manager;
  }, [schema.$id, schema.metadata.allowAutosave, schema.metadata.sensitivity, schema.version]);

  React.useEffect(() => {
    return () => {
      persistenceRef.current = null;
      persistencePromiseRef.current = null;
    };
  }, []);

  const applyValidationErrors = React.useCallback(
    (errors: ValidationError[]) => {
      methods.clearErrors();
      errors.forEach((error) => {
        const path = error.path.replace(/^\//, '').replace(/\//g, '.');
        const name = (path || error.property || '').trim();
        if (!name) return;
        methods.setError(name as any, {
          type: error.keyword || 'manual',
          message: error.message,
        });
      });
    },
    [methods],
  );

  const markStepError = React.useCallback((stepId: string) => {
    setErrorSteps((prev) => (prev.includes(stepId) ? prev : [...prev, stepId]));
  }, []);

  const clearStepError = React.useCallback((stepId: string) => {
    setErrorSteps((prev) => prev.filter((item) => item !== stepId));
  }, []);

  const validateCurrentStep = React.useCallback(async () => {
    if (!shouldValidateOnStepChange) {
      return true;
    }

    if (!currentStepSchema || !currentStepId) {
      return true;
    }
    const stepFields = Object.keys(currentStepSchema.properties ?? {});
    const isValid = await methods.trigger(stepFields as any, { shouldFocus: false });
    if (isValid) {
      clearStepError(currentStepId);
    } else {
      markStepError(currentStepId);
    }
    return isValid;
  }, [
    clearStepError,
    currentStepId,
    currentStepSchema,
    markStepError,
    methods,
    shouldValidateOnStepChange,
  ]);

  const validateAllSteps = React.useCallback(
    async (data: Record<string, unknown>): Promise<StepValidationResult> => {
      for (const stepId of visibleSteps) {
        const stepConfig = schema.steps.find((step) => step.id === stepId);
        if (!stepConfig) {
          continue;
        }
        const stepSchema = resolveStepSchema(stepConfig, schema);
        const result = await validationEngineRef.current.validate(stepSchema, data);
        if (!result.valid) {
          applyValidationErrors(result.errors);
          markStepError(stepConfig.id);
          return { valid: false, failedStep: stepConfig.id };
        }
        clearStepError(stepConfig.id);
      }
      return { valid: true };
    },
    [applyValidationErrors, clearStepError, markStepError, schema, visibleSteps],
  );

  const saveDraftAfterFailure = React.useCallback(
    async (values: Record<string, unknown>) => {
      const manager = await ensurePersistenceManager();
      if (!manager) {
        return false;
      }

      const stepId =
        currentStepId ??
        visibleSteps[currentStepIndex] ??
        visibleSteps[visibleSteps.length - 1] ??
        schema.steps[0]?.id ??
        'root';

      try {
        await manager.saveDraft(values, stepId, completedSteps, {
          manual: true,
          immediate: true,
        });
        await manager.flushPendingSaves();
        return true;
      } catch (error) {
        console.error('Failed to persist draft after submission failure', error);
        return false;
      }
    },
    [
      completedSteps,
      currentStepId,
      currentStepIndex,
      ensurePersistenceManager,
      schema.steps,
      visibleSteps,
    ],
  );

  const getErrorStatus = React.useCallback((error: unknown): number | undefined => {
    if (!error || typeof error !== 'object') {
      return undefined;
    }

    const withStatus = error as {
      status?: number;
      response?: { status?: number };
      cause?: unknown;
    };
    if (typeof withStatus.status === 'number') {
      return withStatus.status;
    }
    if (withStatus.response && typeof withStatus.response === 'object') {
      const responseStatus = (withStatus.response as { status?: number }).status;
      if (typeof responseStatus === 'number') {
        return responseStatus;
      }
    }
    if (withStatus.cause && typeof withStatus.cause === 'object') {
      const causeStatus = (withStatus.cause as { status?: number }).status;
      if (typeof causeStatus === 'number') {
        return causeStatus;
      }
    }
    return undefined;
  }, []);

  const isOfflineError = React.useCallback((error: unknown): boolean => {
    const navigatorOffline =
      typeof navigator !== 'undefined' && typeof navigator.onLine === 'boolean'
        ? navigator.onLine === false
        : false;
    if (navigatorOffline) {
      return true;
    }

    if (error instanceof TypeError) {
      return true;
    }

    if (error && typeof error === 'object' && 'message' in error) {
      const message = (error as { message?: unknown }).message;
      if (typeof message === 'string') {
        const lower = message.toLowerCase();
        if (lower.includes('failed to fetch') || lower.includes('networkerror')) {
          return true;
        }
      }
    }

    return false;
  }, []);

  const handleFormSubmit = React.useCallback(async () => {
    if (isSessionExpired) {
      setSubmissionFeedback({
        type: 'error',
        message: 'Your session expired. Start a new session to submit the form.',
      });
      return;
    }

    if (submitInFlightRef.current) {
      return;
    }

    submitInFlightRef.current = true;
    setSubmitting(true);
    setSubmissionFeedback(null);
    try {
      await flushPendingValidation();

      const isFormValid = await methods.trigger(undefined, { shouldFocus: false });
      if (!isFormValid) {
        scrollToFirstError();
        onValidationError?.(methods.formState.errors);
        return;
      }

      const values = methods.getValues();
      const { valid, failedStep } = await validateAllSteps(values);
      if (!valid) {
        if (failedStep) {
          const failedIndex = visibleSteps.indexOf(failedStep);
          if (failedIndex >= 0) {
            setCurrentStepIndex(failedIndex);
          }
        }
        scrollToFirstError();
        onValidationError?.(methods.formState.errors);
        return;
      }

      const summaryValues = buildSubmissionSummary(values, {
        schema,
        visibleSteps,
        retainHidden: schema.metadata?.retainHidden === true,
        visibilityController: visibilityControllerRef.current,
      });

      const submissionData = {
        ...summaryValues,
        _meta: {
          schemaId: schema.$id,
          schemaVersion: schema.version,
          submittedAt: new Date().toISOString(),
          completedSteps: visibleSteps,
        },
      };

      const maxAttempts = 3;
      const baseDelay = 500;

      for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
        try {
          await onSubmit(submissionData);
          setCompletedSteps((prev) => Array.from(new Set([...prev, ...visibleSteps])));
          setSubmissionFeedback(null);
          return;
        } catch (error) {
          const offline = isOfflineError(error);
          const status = getErrorStatus(error);
          const retryable =
            typeof status === 'number'
              ? status === 429 || (status >= 500 && status < 600)
              : false;

          if (attempt < maxAttempts && retryable && !offline) {
            setSubmissionFeedback({
              type: 'info',
              message: `Submission failed (attempt ${attempt} of ${maxAttempts}). Retrying…`,
            });
            const delay = baseDelay * 2 ** (attempt - 1);
            await new Promise((resolve) => setTimeout(resolve, delay));
            continue;
          }

          const draftSaved = await saveDraftAfterFailure(values);
          if (offline) {
            setSubmissionFeedback({
              type: 'error',
              message: draftSaved
                ? 'You appear to be offline. We saved your progress so you can try again when you reconnect.'
                : 'You appear to be offline. Check your connection and try again when you are back online.',
            });
            console.error('Form submission failed (offline)', error);
          } else {
            setSubmissionFeedback({
              type: 'error',
              message: draftSaved
                ? 'We were unable to submit your form. Your progress was saved so you can try again shortly.'
                : 'We were unable to submit your form. Please try again shortly.',
            });
            console.error('Form submission failed', error);
          }
          return;
        }
      }
    } finally {
      submitInFlightRef.current = false;
      setSubmitting(false);
    }
  }, [
    flushPendingValidation,
    getErrorStatus,
    isOfflineError,
    isSessionExpired,
    methods,
    methods.formState.errors,
    onSubmit,
    onValidationError,
    saveDraftAfterFailure,
    schema,
    setCurrentStepIndex,
    validateAllSteps,
    visibleSteps,
  ]);

  const handleSubmitEvent = React.useCallback(
    (event?: React.FormEvent<HTMLFormElement>) => {
      event?.preventDefault();
      event?.stopPropagation();
      void handleFormSubmit();
    },
    [handleFormSubmit],
  );

  const handleNext = React.useCallback(async () => {
    if (isSessionExpired || !currentStepSchema || !currentStepConfig || !currentStepId) {
      return;
    }
    const isValid = await validateCurrentStep();
    if (!isValid) {
      scrollToFirstError();
      return;
    }

    clearStepError(currentStepId);
    setCompletedSteps((prev) => (prev.includes(currentStepId) ? prev : [...prev, currentStepId]));

    let nextStepId: string | undefined =
      transitionEngineRef.current.getNextStep(schema, currentStepConfig.id, methods.getValues()) ??
      undefined;
    if (nextStepId && !visibleSteps.includes(nextStepId)) {
      nextStepId = undefined;
    }
    if (!nextStepId) {
      nextStepId = visibleSteps[currentStepIndex + 1];
    }

    if (nextStepId) {
      const nextIndex = visibleSteps.indexOf(nextStepId);
      if (nextIndex >= 0) {
        setStepHistory((history) => [...history, currentStepId]);
        setCurrentStepIndex(nextIndex);
        return;
      }
    }

    if (currentStepIndex === visibleSteps.length - 1) {
      await handleFormSubmit();
    }
  }, [
    clearStepError,
    currentStepConfig,
    currentStepId,
    currentStepIndex,
    currentStepSchema,
    handleFormSubmit,
    isSessionExpired,
    methods,
    schema,
    validateCurrentStep,
    visibleSteps,
  ]);

  const handlePrevious = React.useCallback(() => {
    if (isSessionExpired || !currentStepId) {
      return;
    }
    const previousFromHistory = stepHistory[stepHistory.length - 1];
    const fallbackIndex = visibleSteps.indexOf(currentStepId) - 1;
    const fallbackStep = fallbackIndex >= 0 ? visibleSteps[fallbackIndex] : undefined;
    const targetStep = previousFromHistory ?? fallbackStep;
    if (!targetStep) {
      return;
    }
    const previousIndex = visibleSteps.indexOf(targetStep);
    if (previousIndex >= 0) {
      setStepHistory((history) => history.slice(0, -1));
      setCurrentStepIndex(previousIndex);
    }
  }, [currentStepId, isSessionExpired, stepHistory, visibleSteps]);

  const focusField = React.useCallback((fieldName: string) => {
    if (typeof document === 'undefined') {
      return;
    }
    const escapedName =
      typeof CSS !== 'undefined' && typeof CSS.escape === 'function'
        ? CSS.escape(fieldName)
        : fieldName.replace(/"/g, '\\"');
    const selector = `[name="${escapedName}"]`;
    const element = document.querySelector<HTMLElement>(selector);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      if (typeof element.focus === 'function') {
        element.focus({ preventScroll: true });
      }
    }
  }, []);

  const warningThresholdMs = React.useMemo(() => {
    if (!sessionTimeoutMs) {
      return 0;
    }
    return Math.min(sessionTimeoutMs, 5 * 60 * 1000);
  }, [sessionTimeoutMs]);

  const sessionBanner = React.useMemo(() => {
    if (!sessionTimeoutMs || timeRemainingMs == null) {
      return null;
    }

    if (isSessionExpired) {
      return {
        type: 'error' as const,
        message: 'Your session expired. Start a new session or restore a saved draft to continue.',
      };
    }

    const message = `Session expires in ${formatDuration(timeRemainingMs)}.`;
    if (timeRemainingMs <= warningThresholdMs) {
      return { type: 'warning' as const, message };
    }

    return { type: 'info' as const, message };
  }, [isSessionExpired, sessionTimeoutMs, timeRemainingMs, warningThresholdMs]);

  const handleRestartSession = React.useCallback(async () => {
    if (!sessionTimeoutMs) {
      return;
    }

    setSessionActionPending('restart');
    try {
      const manager = await ensurePersistenceManager();
      if (manager) {
        try {
          await manager.deleteDraft();
        } catch (error) {
          console.error('Failed to delete draft when restarting session', error);
        }
      }

      setCompletedSteps([]);
      setErrorSteps([]);
      setStepHistory([]);
      setCurrentStepIndex(0);
      visibilityControllerRef.current.clearCache();
      reset(resolvedInitialData, {
        keepDefaultValues: false,
        keepDirty: false,
        keepErrors: false,
      });

      const nextExpiry = Date.now() + sessionTimeoutMs;
      setSessionExpiresAt(nextExpiry);
      setTimeRemainingMs(sessionTimeoutMs);
      setSessionExpired(false);
      setSubmissionFeedback({
        type: 'info',
        message: 'Started a new session. You can continue completing the form.',
      });
    } catch (error) {
      console.error('Failed to restart session', error);
      setSubmissionFeedback({
        type: 'error',
        message: 'We could not restart your session. Please reload the page to continue.',
      });
    } finally {
      setSessionActionPending(null);
    }
  }, [
    ensurePersistenceManager,
    reset,
    resolvedInitialData,
    sessionTimeoutMs,
    setCompletedSteps,
    setErrorSteps,
    visibilityControllerRef,
  ]);

  const handleRestoreSession = React.useCallback(async () => {
    if (!sessionTimeoutMs) {
      return;
    }

    setSessionActionPending('restore');
    try {
      const manager = await ensurePersistenceManager();
      if (!manager) {
        setSubmissionFeedback({
          type: 'error',
          message: 'Saved progress is unavailable. Start a new session to continue.',
        });
        return;
      }

      const draft = await manager.loadDraft();
      if (!draft) {
        setSubmissionFeedback({
          type: 'error',
          message: 'No saved progress found. Start a new session to continue.',
        });
        return;
      }

      reset((draft.data as Record<string, unknown>) ?? {}, {
        keepDefaultValues: false,
        keepDirty: false,
        keepErrors: false,
      });

      visibilityControllerRef.current.clearCache();
      setCompletedSteps(Array.isArray(draft.completedSteps) ? draft.completedSteps : []);
      setErrorSteps([]);
      setStepHistory([]);
      if (draft.currentStep) {
        const targetIndex = Math.max(
          schema.steps.findIndex((step) => step.id === draft.currentStep),
          0,
        );
        setCurrentStepIndex(targetIndex >= 0 ? targetIndex : 0);
      } else {
        setCurrentStepIndex(0);
      }

      const nextExpiry = Date.now() + sessionTimeoutMs;
      setSessionExpiresAt(nextExpiry);
      setTimeRemainingMs(sessionTimeoutMs);
      setSessionExpired(false);
      setSubmissionFeedback({
        type: 'info',
        message: 'Restored your saved progress and restarted the session.',
      });
    } catch (error) {
      console.error('Failed to restore session from draft', error);
      setSubmissionFeedback({
        type: 'error',
        message: 'We could not restore your saved progress. Start a new session to continue.',
      });
    } finally {
      setSessionActionPending(null);
    }
  }, [
    ensurePersistenceManager,
    reset,
    schema.steps,
    sessionTimeoutMs,
    setCompletedSteps,
    visibilityControllerRef,
  ]);

  const layoutType = schema.ui?.layout?.type ?? 'single-column';
  const prefersGridLayout = layoutType === 'grid';
  const isGridLayoutEnabled = useFlag('gridLayout');
  const activeLayout = prefersGridLayout && isGridLayoutEnabled ? 'grid' : 'single-column';

  if (!currentStepSchema || !currentStepConfig || !visibleSteps.length) {
    return null;
  }

  const stepProperties = currentStepSchema.properties ?? {};
  const visibleFields = visibilityControllerRef.current.getVisibleFields(
    schema,
    currentStepId,
    watchedValues,
  );

  const stepStatusList = visibleSteps.map((stepId) =>
    getStepStatus(stepId, currentStepId, completedSteps, errorStepSet),
  );

  const widgetDefinitions = schema.ui?.widgets ?? {};

  return (
    <FormProvider {...methods}>
      <form
        className={className}
        data-layout={activeLayout}
        onSubmit={handleSubmitEvent}
        noValidate
      >
        {submissionFeedback ? (
          <div
            role={submissionFeedback.type === 'error' ? 'alert' : 'status'}
            aria-live={submissionFeedback.type === 'error' ? 'assertive' : 'polite'}
            className={cn(
              'rounded-md border px-4 py-3 text-sm',
              submissionFeedback.type === 'error'
                ? 'border-red-200 bg-red-50 text-red-900'
                : 'border-blue-200 bg-blue-50 text-blue-900',
            )}
          >
            {submissionFeedback.message}
          </div>
        ) : null}
        {sessionBanner ? (
          <div
            role={sessionBanner.type === 'error' ? 'alert' : 'status'}
            aria-live={sessionBanner.type === 'error' ? 'assertive' : 'polite'}
            className={cn(
              'rounded-md border px-4 py-3 text-sm',
              sessionBanner.type === 'error'
                ? 'border-red-200 bg-red-50 text-red-900'
                : sessionBanner.type === 'warning'
                  ? 'border-amber-200 bg-amber-50 text-amber-900'
                  : 'border-slate-200 bg-slate-50 text-slate-900',
            )}
          >
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <p className="font-medium">{sessionBanner.message}</p>
              {isSessionExpired ? (
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    className="rounded-md bg-primary px-3 py-1.5 text-sm font-semibold text-primary-foreground shadow focus:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-60"
                    onClick={() => void handleRestartSession()}
                    disabled={sessionActionPending !== null}
                  >
                    {sessionActionPending === 'restart' ? 'Restarting…' : 'Start new session'}
                  </button>
                  <button
                    type="button"
                    className="rounded-md border border-input px-3 py-1.5 text-sm font-semibold text-foreground shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-60"
                    onClick={() => void handleRestoreSession()}
                    disabled={sessionActionPending !== null}
                  >
                    {sessionActionPending === 'restore' ? 'Restoring…' : 'Restore saved draft'}
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        ) : null}
        <div className="space-y-6">
          <StepProgress
            steps={visibleSteps.map((stepId, index) => ({
              id: stepId,
              title: schema.steps.find((step) => step.id === stepId)?.title ?? stepId,
              status: stepStatusList[index],
            }))}
            currentStep={currentStepId}
            onStepSelect={(stepId) => {
              if (isSessionExpired) {
                return;
              }
              const targetIndex = visibleSteps.indexOf(stepId);
              if (targetIndex >= 0 && targetIndex <= currentStepIndex) {
                setCurrentStepIndex(targetIndex);
              }
            }}
          />

          <div className="rounded-lg border bg-background shadow-sm">
            <div className="border-b p-6">
              <h2 className="text-lg font-semibold text-foreground">{currentStepConfig.title}</h2>
              {currentStepConfig.description ? (
                <p className="mt-2 text-sm text-muted-foreground">
                  {currentStepConfig.description}
                </p>
              ) : null}
            </div>

            <div className="space-y-6 p-6">
              <div className="space-y-4">
                {Object.entries(stepProperties).map(([fieldName]) => {
                  if (!visibleFields.includes(fieldName)) {
                    return null;
                  }

                  const uiConfig = widgetDefinitions[fieldName];
                  if (!uiConfig) {
                    console.warn(`No widget configuration found for field: ${fieldName}`);
                    return null;
                  }

                  const {
                    component,
                    label,
                    placeholder,
                    helpText,
                    description,
                    className: widgetClassName,
                    options,
                    disabled,
                    readOnly,
                    ...componentProps
                  } = uiConfig;

                  const widget: WidgetType = component ?? 'Text';
                  const fieldError =
                    methods.formState.errors?.[fieldName as keyof typeof methods.formState.errors];
                  const errorMessage = (() => {
                    if (fieldError && typeof fieldError === 'object' && 'message' in fieldError) {
                      return (fieldError as { message?: string }).message ?? 'Invalid value';
                    }
                    if (typeof fieldError === 'string') {
                      return fieldError;
                    }
                    return undefined;
                  })();

                  const isRequired = Array.isArray(currentStepSchema.required)
                    ? currentStepSchema.required.includes(fieldName)
                    : false;

                  return (
                    <FieldFactory
                      key={fieldName}
                      name={fieldName}
                      label={label ?? fieldName}
                      widget={widget}
                      placeholder={placeholder}
                      description={description}
                      helpText={helpText}
                      className={widgetClassName as string | undefined}
                      disabled={mode === 'view' || disabled || isSessionExpired}
                      readOnly={readOnly}
                      required={isRequired}
                      control={methods.control}
                      rules={undefined}
                      options={options}
                      componentProps={componentProps as Record<string, unknown>}
                      error={errorMessage}
                    />
                  );
                })}
              </div>

              <ErrorSummary errors={methods.formState.errors} onFocusField={focusField} />
            </div>

            <div
              className={cn('flex items-center justify-between gap-4 border-t p-6', 'bg-muted/30')}
            >
              <button
                type="button"
                onClick={handlePrevious}
                disabled={currentStepIndex === 0 || isSessionExpired}
                className={cn(
                  'rounded-md border border-input px-4 py-2 text-sm font-medium text-foreground transition-colors',
                  (currentStepIndex === 0 || isSessionExpired) && 'opacity-50',
                )}
              >
                Previous
              </button>

              <div className="flex gap-2">
                {currentStepIndex < visibleSteps.length - 1 ? (
                  <button
                    type="button"
                    onClick={handleNext}
                    className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow hover:bg-primary/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    disabled={isSubmitting || isSessionExpired}
                  >
                    Next
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={isSubmitting || isSessionExpired}
                    className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow hover:bg-primary/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  >
                    {isSubmitting ? 'Submitting…' : 'Submit'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </form>
    </FormProvider>
  );
};

export const FormRenderer: React.FC<FormRendererProps> = (props) => {
  return (
    <FeaturesProvider schema={props.schema}>
      <FormRendererInner {...props} />
    </FeaturesProvider>
  );
};
