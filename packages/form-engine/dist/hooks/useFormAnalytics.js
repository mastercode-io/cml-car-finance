import { useCallback, useEffect, useMemo, useRef } from 'react';
import { FormAnalytics, resolveSamplingRate } from '../analytics/FormAnalytics';
import { PerformanceBudget } from '../performance/PerformanceBudget';
import { DEFAULT_PAYLOAD_VERSION } from '../persistence/PersistenceManager';
const DEFAULT_HOOK_CONFIG = {
    enabled: true,
    sensitive: true,
    bufferSize: 10,
    flushInterval: 5000,
};
export function useFormAnalytics(formId, schemaVersion, config) {
    const analyticsRef = useRef(null);
    const performanceBudgetRef = useRef(null);
    const serializedConfig = useMemo(() => JSON.stringify(config ?? {}), [config]);
    useEffect(() => {
        const mergedConfig = {
            ...DEFAULT_HOOK_CONFIG,
            ...config,
            enabled: config?.enabled ?? DEFAULT_HOOK_CONFIG.enabled,
            sampling: resolveSamplingRate(config?.sampling),
            formId,
            schemaVersion,
            payloadVersion: config?.payloadVersion ?? DEFAULT_PAYLOAD_VERSION,
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
    const trackStepView = useCallback((stepId) => {
        analyticsRef.current?.trackStepView(stepId);
    }, []);
    const trackFieldInteraction = useCallback((fieldName, value, eventType) => {
        analyticsRef.current?.trackEvent(`field_${eventType}`, {
            formId,
            schemaVersion,
            fieldName,
            hasValue: value !== null && value !== undefined && value !== '',
            valueLength: typeof value === 'string' ? value.length : undefined,
        }, 'field', { formId, schemaVersion, fieldName });
    }, [formId, schemaVersion]);
    const trackValidation = useCallback((stepId, errors, success, durationMs) => {
        analyticsRef.current?.trackEvent('validation_attempt', { formId, schemaVersion, stepId }, 'performance', { formId, schemaVersion, stepId });
        if (typeof durationMs === 'number') {
            performanceBudgetRef.current?.checkBudget('validation', durationMs);
        }
        else if (typeof performance !== 'undefined') {
            const entry = performance.getEntriesByName(`validation_${stepId}`).at(-1);
            if (entry) {
                performanceBudgetRef.current?.checkBudget('validation', entry.duration);
            }
        }
        const eventName = success ? 'validation_success' : 'validation_error';
        analyticsRef.current?.trackEvent(eventName, {
            formId,
            schemaVersion,
            stepId,
            errorCount: Object.keys(errors ?? {}).length,
            errorFields: Object.keys(errors ?? {}),
        }, success ? 'performance' : 'error', { formId, schemaVersion, stepId });
    }, [formId, schemaVersion]);
    const trackSubmission = useCallback((success, data, error) => {
        const metrics = analyticsRef.current?.getSessionMetrics();
        const start = metrics?.startTime ?? Date.now();
        analyticsRef.current?.trackEvent(success ? 'form_submitted' : 'submission_error', {
            formId,
            schemaVersion,
            success,
            error: error?.message,
            completionTime: Date.now() - start,
            payloadSize: data ? JSON.stringify(data).length : undefined,
        }, success ? 'form' : 'error', { formId, schemaVersion });
        if (success && metrics?.endTime) {
            performanceBudgetRef.current?.checkBudget('formCompletion', metrics.endTime - metrics.startTime);
        }
    }, [formId, schemaVersion]);
    const measureStepTransition = useCallback((from, to) => analyticsRef.current?.measureStepTransition(from, to), []);
    const startValidationMeasurement = useCallback((stepId) => analyticsRef.current?.measureValidation(stepId), []);
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
//# sourceMappingURL=useFormAnalytics.js.map