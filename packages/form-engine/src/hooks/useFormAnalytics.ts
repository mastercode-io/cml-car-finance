import { useCallback, useEffect, useMemo, useRef } from 'react';

import { FormAnalytics } from '../analytics/FormAnalytics';
import { PerformanceBudget } from '../performance/PerformanceBudget';
import type { FormAnalyticsConfig, SessionMetrics } from '../types';

const DEFAULT_HOOK_CONFIG: Pick<
  FormAnalyticsConfig,
  'enabled' | 'sampling' | 'sensitive' | 'bufferSize' | 'flushInterval'
> = {
  enabled: true,
  sampling: 1,
  sensitive: true,
  bufferSize: 10,
  flushInterval: 5000,
};

export interface UseFormAnalyticsResult {
  trackStepView: (stepId: string) => void;
  trackFieldInteraction: (
    fieldName: string,
    value: unknown,
    eventType: 'focus' | 'blur' | 'change',
  ) => void;
  trackValidation: (
    stepId: string,
    errors: Record<string, any>,
    success: boolean,
    durationMs?: number,
  ) => void;
  trackSubmission: (success: boolean, data?: unknown, error?: Error) => void;
  measureStepTransition: (from: string, to: string) => (() => void) | undefined;
  startValidationMeasurement: (stepId: string) => (() => void) | undefined;
  getSessionId: () => string | undefined;
  getSessionMetrics: () => SessionMetrics | undefined;
}

export function useFormAnalytics(
  formId: string,
  schemaVersion: string,
  config?: Partial<FormAnalyticsConfig>,
): UseFormAnalyticsResult {
  const analyticsRef = useRef<FormAnalytics | null>(null);
  const performanceBudgetRef = useRef<PerformanceBudget | null>(null);
  const serializedConfig = useMemo(() => JSON.stringify(config ?? {}), [config]);

  useEffect(() => {
    const mergedConfig: FormAnalyticsConfig = {
      ...DEFAULT_HOOK_CONFIG,
      ...config,
      enabled: config?.enabled ?? DEFAULT_HOOK_CONFIG.enabled,
    };

    analyticsRef.current = new FormAnalytics(mergedConfig);
    performanceBudgetRef.current = new PerformanceBudget(mergedConfig.performanceBudgets);

    analyticsRef.current.trackEvent('form_initialized', { formId, schemaVersion }, 'form', {
      formId,
      schemaVersion,
      sensitive: false,
    });

    return () => {
      analyticsRef.current?.destroy();
      performanceBudgetRef.current?.reset();
      performanceBudgetRef.current = null;
    };
  }, [formId, schemaVersion, serializedConfig]);

  const trackStepView = useCallback(
    (stepId: string) => {
      analyticsRef.current?.trackEvent(
        'step_viewed',
        { formId, schemaVersion, stepId },
        'navigation',
        { formId, schemaVersion, stepId, sensitive: false },
      );
    },
    [formId, schemaVersion],
  );

  const trackFieldInteraction = useCallback(
    (fieldName: string, value: unknown, eventType: 'focus' | 'blur' | 'change') => {
      analyticsRef.current?.trackEvent(
        `field_${eventType}`,
        {
          formId,
          schemaVersion,
          fieldName,
          hasValue: value !== null && value !== undefined && value !== '',
          valueLength: typeof value === 'string' ? value.length : undefined,
        },
        'field',
        { formId, schemaVersion, fieldName },
      );
    },
    [formId, schemaVersion],
  );

  const trackValidation = useCallback(
    (stepId: string, errors: Record<string, any>, success: boolean, durationMs?: number) => {
      analyticsRef.current?.trackEvent(
        'validation_attempt',
        { formId, schemaVersion, stepId },
        'performance',
        { formId, schemaVersion, stepId },
      );

      if (typeof durationMs === 'number') {
        performanceBudgetRef.current?.checkBudget('validation', durationMs);
      } else if (typeof performance !== 'undefined') {
        const entry = performance.getEntriesByName(`validation_${stepId}`).at(-1);
        if (entry) {
          performanceBudgetRef.current?.checkBudget('validation', entry.duration);
        }
      }

      const eventName = success ? 'validation_success' : 'validation_error';
      analyticsRef.current?.trackEvent(
        eventName,
        {
          formId,
          schemaVersion,
          stepId,
          errorCount: Object.keys(errors ?? {}).length,
          errorFields: Object.keys(errors ?? {}),
        },
        success ? 'performance' : 'error',
        { formId, schemaVersion, stepId },
      );
    },
    [formId, schemaVersion],
  );

  const trackSubmission = useCallback(
    (success: boolean, data?: unknown, error?: Error) => {
      const metrics = analyticsRef.current?.getSessionMetrics();
      const start = metrics?.startTime ?? Date.now();
      analyticsRef.current?.trackEvent(
        success ? 'form_submitted' : 'submission_error',
        {
          formId,
          schemaVersion,
          success,
          error: error?.message,
          completionTime: Date.now() - start,
          payloadSize: data ? JSON.stringify(data).length : undefined,
        },
        success ? 'form' : 'error',
        { formId, schemaVersion },
      );

      if (success && metrics?.endTime) {
        performanceBudgetRef.current?.checkBudget(
          'formCompletion',
          metrics.endTime - metrics.startTime,
        );
      }
    },
    [formId, schemaVersion],
  );

  const measureStepTransition = useCallback(
    (from: string, to: string) => analyticsRef.current?.measureStepTransition(from, to),
    [],
  );

  const startValidationMeasurement = useCallback(
    (stepId: string) => analyticsRef.current?.measureValidation(stepId),
    [],
  );

  const getSessionId = useCallback(() => analyticsRef.current?.getSessionId(), []);

  const getSessionMetrics = useCallback(() => analyticsRef.current?.getSessionMetrics(), []);

  return {
    trackStepView,
    trackFieldInteraction,
    trackValidation,
    trackSubmission,
    measureStepTransition,
    startValidationMeasurement,
    getSessionId,
    getSessionMetrics,
  };
}
