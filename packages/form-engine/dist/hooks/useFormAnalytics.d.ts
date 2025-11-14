import type { FormAnalyticsConfig, SessionMetrics } from '../types';
export interface UseFormAnalyticsResult {
    trackStepView: (stepId: string) => void;
    trackFieldInteraction: (fieldName: string, value: unknown, eventType: 'focus' | 'blur' | 'change') => void;
    trackValidation: (stepId: string, errors: Record<string, any>, success: boolean, durationMs?: number) => void;
    trackSubmission: (success: boolean, data?: unknown, error?: Error) => void;
    measureStepTransition: (from: string, to: string) => (() => void) | undefined;
    startValidationMeasurement: (stepId: string) => (() => void) | undefined;
    getSessionId: () => string | undefined;
    getSessionMetrics: () => SessionMetrics | undefined;
}
export declare function useFormAnalytics(formId: string, schemaVersion: string, config?: Partial<FormAnalyticsConfig>): UseFormAnalyticsResult;
//# sourceMappingURL=useFormAnalytics.d.ts.map