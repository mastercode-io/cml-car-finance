export interface AnalyticsEvent {
    v: number;
    payloadVersion: string;
    name: string;
    category?: 'form' | 'field' | 'navigation' | 'performance' | 'error';
    data: Record<string, any>;
    timestamp: number;
    sessionId: string;
    formId?: string;
    schemaVersion?: string;
    stepId?: string;
    fieldName?: string;
}
export interface PerformanceMetric {
    name: string;
    value: number;
    unit: 'ms' | 'bytes' | 'count';
    timestamp: number;
    metadata?: Record<string, any>;
}
export interface FormAnalyticsConfig {
    enabled: boolean;
    endpoint?: string;
    sampling?: number;
    sensitive?: boolean;
    bufferSize?: number;
    flushInterval?: number;
    performanceBudgets?: PerformanceBudgets;
    formId?: string;
    schemaVersion?: string;
    payloadVersion?: string;
    eventVersion?: number;
}
export interface PerformanceBudgets {
    stepTransition?: number;
    validation?: number;
    initialLoad?: number;
    bundleSize?: number;
    formCompletion?: number;
}
export interface SessionMetrics {
    startTime: number;
    endTime?: number;
    completedSteps: string[];
    errors: number;
    validationAttempts: number;
    fieldInteractions: number;
    abandonedAt?: string;
}
export interface PerformanceBudgetViolation {
    metric: string;
    actual: number;
    budget: number;
    timestamp: number;
    severity: 'warning' | 'critical';
    context?: Record<string, any>;
}
//# sourceMappingURL=analytics.types.d.ts.map