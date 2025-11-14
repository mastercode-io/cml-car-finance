import type { AnalyticsEvent, FormAnalyticsConfig, SessionMetrics } from '../types';
interface TrackEventOptions extends Partial<Pick<AnalyticsEvent, 'category' | 'formId' | 'schemaVersion' | 'stepId' | 'fieldName'>> {
    sensitive?: boolean;
}
export declare const resolveSamplingRate: (explicit?: number) => number;
export declare class FormAnalytics {
    private events;
    private sessionId;
    private config;
    private performanceObserver?;
    private sessionMetrics;
    private flushTimer?;
    private listenersAttached;
    private analyticsVersion;
    private payloadVersion;
    private formId?;
    private schemaVersion?;
    private stepViewTimeline;
    private lastLoopEventAt;
    constructor(config: FormAnalyticsConfig);
    trackStepView(stepId: string): void;
    trackEvent(eventName: string, data?: Record<string, any>, category?: AnalyticsEvent['category'], options?: TrackEventOptions): void;
    measureStepTransition(from: string, to: string): (() => void) | undefined;
    measureValidation(stepId: string): (() => void) | undefined;
    getSessionId(): string;
    getSessionMetrics(): SessionMetrics;
    destroy(): void;
    private initialize;
    private shouldTrack;
    private updateSessionMetrics;
    private sanitizeData;
    private initPerformanceMonitoring;
    private trackPerformanceEntry;
    private checkPerformanceBudget;
    private initEventListeners;
    private handleVisibilityChange;
    private handleUnload;
    private startFlushTimer;
    private flush;
    private sendEvents;
    private sendBeacon;
    private generateSessionId;
    private randomId;
    private recordStepView;
}
export {};
//# sourceMappingURL=FormAnalytics.d.ts.map