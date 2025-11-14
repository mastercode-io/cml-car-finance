import { DEFAULT_PAYLOAD_VERSION } from '../persistence/PersistenceManager';
const SAMPLING_ENV_KEYS = ['NEXT_PUBLIC_FORM_ANALYTICS_SAMPLING', 'FORM_ANALYTICS_SAMPLING'];
const clampSampling = (value) => {
    if (Number.isNaN(value)) {
        return 0;
    }
    if (value > 1) {
        return Math.min(1, Math.max(0, value / 100));
    }
    return Math.min(1, Math.max(0, value));
};
const resolveSamplingFromEnv = () => {
    if (typeof process === 'undefined' || !process?.env) {
        return undefined;
    }
    for (const key of SAMPLING_ENV_KEYS) {
        const rawValue = process.env[key];
        if (typeof rawValue === 'string' && rawValue.trim() !== '') {
            const parsed = Number.parseFloat(rawValue.trim());
            if (!Number.isNaN(parsed)) {
                return clampSampling(parsed);
            }
        }
    }
    return undefined;
};
export const resolveSamplingRate = (explicit) => {
    if (typeof explicit === 'number') {
        return clampSampling(explicit);
    }
    const envSampling = resolveSamplingFromEnv();
    if (typeof envSampling === 'number') {
        return envSampling;
    }
    const environment = typeof process !== 'undefined' ? process.env.NODE_ENV : undefined;
    return environment === 'production' ? 0.01 : 1;
};
const DEFAULT_CONFIG = {
    sensitive: true,
    bufferSize: 25,
    flushInterval: 8000,
};
const LOOP_DETECTION_WINDOW_MS = 2000;
const LOOP_EVENT_THROTTLE_MS = 2000;
const DEFAULT_EVENT_VERSION = 1;
export class FormAnalytics {
    events = [];
    sessionId;
    config;
    performanceObserver;
    sessionMetrics;
    flushTimer;
    listenersAttached = false;
    analyticsVersion;
    payloadVersion;
    formId;
    schemaVersion;
    stepViewTimeline = [];
    lastLoopEventAt = 0;
    constructor(config) {
        this.config = {
            ...DEFAULT_CONFIG,
            ...config,
            sampling: resolveSamplingRate(config.sampling),
        };
        this.sessionId = this.generateSessionId();
        this.analyticsVersion = config.eventVersion ?? DEFAULT_EVENT_VERSION;
        this.payloadVersion = config.payloadVersion ?? DEFAULT_PAYLOAD_VERSION;
        this.formId = config.formId;
        this.schemaVersion = config.schemaVersion;
        this.sessionMetrics = {
            startTime: Date.now(),
            completedSteps: [],
            errors: 0,
            validationAttempts: 0,
            fieldInteractions: 0,
        };
        if (this.config.enabled && typeof window !== 'undefined') {
            this.initialize();
        }
    }
    trackStepView(stepId) {
        if (!this.config.enabled) {
            return;
        }
        this.recordStepView(stepId);
        this.trackEvent('step_viewed', {
            formId: this.formId,
            schemaVersion: this.schemaVersion,
            stepId,
        }, 'navigation', { formId: this.formId, schemaVersion: this.schemaVersion, stepId, sensitive: false });
    }
    trackEvent(eventName, data = {}, category, options = {}) {
        if (!this.config.enabled || !this.shouldTrack()) {
            return;
        }
        const shouldSanitize = options.sensitive ?? this.config.sensitive ?? false;
        const payload = shouldSanitize ? this.sanitizeData(data) : data;
        const event = {
            v: this.analyticsVersion,
            payloadVersion: this.payloadVersion,
            name: eventName,
            category: options.category ?? category,
            data: payload,
            timestamp: Date.now(),
            sessionId: this.sessionId,
            formId: options.formId ??
                (typeof data.formId === 'string' ? data.formId : undefined) ??
                this.formId,
            schemaVersion: options.schemaVersion ??
                (typeof data.schemaVersion === 'string' ? data.schemaVersion : undefined) ??
                this.schemaVersion,
            stepId: options.stepId ?? (typeof data.stepId === 'string' ? data.stepId : undefined),
            fieldName: options.fieldName ?? (typeof data.fieldName === 'string' ? data.fieldName : undefined),
        };
        this.events.push(event);
        this.updateSessionMetrics(eventName, data);
        if (this.config.bufferSize && this.events.length >= this.config.bufferSize) {
            if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
                window.requestIdleCallback(() => {
                    void this.flush();
                });
            }
            else {
                void this.flush();
            }
        }
    }
    measureStepTransition(from, to) {
        if (typeof performance === 'undefined' || typeof performance.mark !== 'function') {
            return undefined;
        }
        const markName = `step_${from}_to_${to}`;
        performance.mark(`${markName}_start`);
        return () => {
            performance.mark(`${markName}_end`);
            performance.measure(markName, `${markName}_start`, `${markName}_end`);
            performance.clearMarks(`${markName}_start`);
            performance.clearMarks(`${markName}_end`);
        };
    }
    measureValidation(stepId) {
        if (typeof performance === 'undefined' || typeof performance.mark !== 'function') {
            return undefined;
        }
        const markName = `validation_${stepId}`;
        performance.mark(`${markName}_start`);
        return () => {
            performance.mark(`${markName}_end`);
            performance.measure(markName, `${markName}_start`, `${markName}_end`);
            performance.clearMarks(`${markName}_start`);
            performance.clearMarks(`${markName}_end`);
        };
    }
    getSessionId() {
        return this.sessionId;
    }
    getSessionMetrics() {
        return { ...this.sessionMetrics, completedSteps: [...this.sessionMetrics.completedSteps] };
    }
    destroy() {
        if (this.performanceObserver) {
            this.performanceObserver.disconnect();
        }
        if (this.flushTimer) {
            clearInterval(this.flushTimer);
            this.flushTimer = undefined;
        }
        if (this.listenersAttached && typeof document !== 'undefined') {
            document.removeEventListener('visibilitychange', this.handleVisibilityChange);
            window.removeEventListener('beforeunload', this.handleUnload);
            this.listenersAttached = false;
        }
        void this.flush();
    }
    initialize() {
        this.initPerformanceMonitoring();
        this.initEventListeners();
        this.startFlushTimer();
    }
    shouldTrack() {
        const sampling = this.config.sampling ?? 1;
        if (sampling >= 1) {
            return true;
        }
        if (sampling <= 0) {
            return false;
        }
        return Math.random() <= sampling;
    }
    updateSessionMetrics(eventName, data) {
        switch (eventName) {
            case 'step_completed':
                if (typeof data.stepId === 'string' &&
                    !this.sessionMetrics.completedSteps.includes(data.stepId)) {
                    this.sessionMetrics.completedSteps.push(data.stepId);
                }
                break;
            case 'validation_error':
                this.sessionMetrics.errors += 1;
                break;
            case 'validation_attempt':
                this.sessionMetrics.validationAttempts += 1;
                break;
            case 'field_changed':
                this.sessionMetrics.fieldInteractions += 1;
                break;
            case 'form_abandoned':
                if (typeof data.stepId === 'string') {
                    this.sessionMetrics.abandonedAt = data.stepId;
                }
                this.sessionMetrics.endTime = Date.now();
                break;
            case 'form_completed':
            case 'form_submitted':
                this.sessionMetrics.endTime = Date.now();
                break;
            default:
                break;
        }
    }
    sanitizeData(data) {
        const sensitiveKeys = ['email', 'phone', 'ssn', 'creditcard', 'credit_card', 'password'];
        const sanitizeValue = (value, path = '') => {
            if (Array.isArray(value)) {
                return value.map((item, index) => sanitizeValue(item, `${path}.${index}`));
            }
            if (value && typeof value === 'object') {
                return Object.entries(value).reduce((acc, [key, val]) => {
                    const currentPath = path ? `${path}.${key}` : key;
                    acc[key] = sanitizeValue(val, currentPath);
                    return acc;
                }, {});
            }
            const fieldName = path.split('.').pop() ?? '';
            if (sensitiveKeys.some((sensitiveKey) => fieldName.toLowerCase().includes(sensitiveKey))) {
                return '[REDACTED]';
            }
            return value;
        };
        return sanitizeValue(data);
    }
    initPerformanceMonitoring() {
        if (typeof window === 'undefined' || typeof PerformanceObserver === 'undefined') {
            return;
        }
        try {
            this.performanceObserver = new PerformanceObserver((list) => {
                for (const entry of list.getEntries()) {
                    this.trackPerformanceEntry(entry);
                }
            });
            this.performanceObserver.observe({
                entryTypes: ['measure', 'navigation', 'resource', 'paint'],
            });
        }
        catch (error) {
            console.warn('Performance monitoring not available:', error);
        }
    }
    trackPerformanceEntry(entry) {
        if (!this.config.enabled) {
            return;
        }
        const metric = {
            name: entry.name,
            value: 'duration' in entry ? entry.duration : 0,
            unit: 'ms',
            timestamp: entry.startTime ?? Date.now(),
            metadata: {
                entryType: entry.entryType,
                detail: typeof entry.toJSON === 'function'
                    ? entry.toJSON()
                    : undefined,
            },
        };
        if (this.config.performanceBudgets) {
            this.checkPerformanceBudget(entry);
        }
        this.trackEvent('performance_metric', metric, 'performance', { sensitive: false });
    }
    checkPerformanceBudget(entry) {
        const budgets = this.config.performanceBudgets;
        if (!budgets) {
            return;
        }
        const duration = 'duration' in entry ? entry.duration : undefined;
        if (duration === undefined) {
            return;
        }
        let budget;
        let metricKey;
        if (entry.name.includes('step_')) {
            budget = budgets.stepTransition;
            metricKey = 'stepTransition';
        }
        else if (entry.name.includes('validation_')) {
            budget = budgets.validation;
            metricKey = 'validation';
        }
        else if (entry.entryType === 'navigation') {
            budget = budgets.initialLoad;
            metricKey = 'initialLoad';
        }
        if (budget && duration > budget) {
            console.warn(`⚠️ Performance budget exceeded for ${metricKey}: ${duration.toFixed(2)}ms (budget: ${budget}ms)`);
            this.trackEvent('performance_budget_exceeded', {
                metric: metricKey,
                actual: duration,
                budget,
                exceeded: duration - budget,
            }, 'performance', { sensitive: false });
        }
    }
    initEventListeners() {
        if (this.listenersAttached ||
            typeof document === 'undefined' ||
            typeof window === 'undefined') {
            return;
        }
        document.addEventListener('visibilitychange', this.handleVisibilityChange);
        window.addEventListener('beforeunload', this.handleUnload);
        this.listenersAttached = true;
        this.trackEvent('form_viewed', {
            url: typeof window !== 'undefined' ? window.location.href : undefined,
            referrer: typeof document !== 'undefined' ? document.referrer : undefined,
        }, 'navigation');
    }
    handleVisibilityChange = () => {
        if (!this.config.enabled) {
            return;
        }
        if (typeof document !== 'undefined' && document.hidden) {
            this.trackEvent('form_hidden', {
                duration: Date.now() - this.sessionMetrics.startTime,
            }, 'navigation');
            void this.flush();
        }
        else {
            this.trackEvent('form_visible', {}, 'navigation');
        }
    };
    handleUnload = () => {
        if (!this.config.enabled) {
            return;
        }
        this.sessionMetrics.endTime = Date.now();
        this.trackEvent('session_end', this.sessionMetrics, 'navigation');
        this.sendBeacon();
    };
    startFlushTimer() {
        if (!this.config.flushInterval || this.config.flushInterval <= 0) {
            return;
        }
        this.flushTimer = setInterval(() => {
            void this.flush();
        }, this.config.flushInterval);
    }
    async flush() {
        if (!this.config.enabled || this.events.length === 0) {
            return;
        }
        const eventsToSend = [...this.events];
        this.events = [];
        try {
            await this.sendEvents(eventsToSend);
        }
        catch (error) {
            console.error('Failed to send analytics:', error);
            this.events.unshift(...eventsToSend);
        }
    }
    async sendEvents(events) {
        if (!this.config.endpoint) {
            if (process.env.NODE_ENV !== 'production') {
                console.debug('Analytics events:', events);
            }
            return;
        }
        if (typeof fetch === 'undefined') {
            return;
        }
        const response = await fetch(this.config.endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                v: this.analyticsVersion,
                payloadVersion: this.payloadVersion,
                events,
                sessionId: this.sessionId,
                timestamp: Date.now(),
            }),
        });
        if (!response.ok) {
            throw new Error(`Analytics API error: ${response.status}`);
        }
    }
    sendBeacon() {
        if (typeof navigator === 'undefined' ||
            typeof navigator.sendBeacon !== 'function' ||
            !this.config.endpoint) {
            return;
        }
        const payload = JSON.stringify({
            v: this.analyticsVersion,
            payloadVersion: this.payloadVersion,
            events: this.events,
            sessionId: this.sessionId,
            sessionMetrics: this.sessionMetrics,
        });
        navigator.sendBeacon(this.config.endpoint, payload);
    }
    generateSessionId() {
        if (typeof window === 'undefined') {
            return `session_${Date.now()}`;
        }
        const storageKey = 'cml-form-session';
        try {
            const existing = window.sessionStorage.getItem(storageKey);
            if (existing) {
                return existing;
            }
            const id = typeof crypto !== 'undefined' && 'randomUUID' in crypto
                ? crypto.randomUUID()
                : this.randomId();
            window.sessionStorage.setItem(storageKey, id);
            return id;
        }
        catch (error) {
            console.warn('Unable to access sessionStorage for analytics session id', error);
            return this.randomId();
        }
    }
    randomId() {
        return `session_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
    }
    recordStepView(stepId) {
        const now = Date.now();
        this.stepViewTimeline.push({ stepId, timestamp: now });
        this.stepViewTimeline = this.stepViewTimeline.filter((entry) => now - entry.timestamp <= LOOP_DETECTION_WINDOW_MS);
        if (this.stepViewTimeline.length === 0) {
            return;
        }
        const dedupedSteps = [];
        for (const entry of this.stepViewTimeline) {
            if (dedupedSteps[dedupedSteps.length - 1] !== entry.stepId) {
                dedupedSteps.push(entry.stepId);
            }
        }
        if (dedupedSteps.length < 4) {
            return;
        }
        const recentSteps = dedupedSteps.slice(-4);
        const uniqueRecentSteps = new Set(recentSteps);
        let loopDetected = false;
        if (uniqueRecentSteps.size === 2) {
            loopDetected =
                recentSteps[0] !== recentSteps[1] &&
                    recentSteps[0] === recentSteps[2] &&
                    recentSteps[1] === recentSteps[3];
        }
        else if (uniqueRecentSteps.size === 3) {
            loopDetected =
                recentSteps[0] === recentSteps[3] &&
                    recentSteps[0] !== recentSteps[1] &&
                    recentSteps[1] !== recentSteps[2] &&
                    recentSteps[0] !== recentSteps[2];
        }
        if (!loopDetected) {
            return;
        }
        if (this.lastLoopEventAt !== 0 && now - this.lastLoopEventAt < LOOP_EVENT_THROTTLE_MS) {
            return;
        }
        this.lastLoopEventAt = now;
        this.trackEvent('nav_loop_detected', {
            formId: this.formId,
            schemaVersion: this.schemaVersion,
            steps: recentSteps,
            uniqueStepCount: uniqueRecentSteps.size,
            windowMs: LOOP_DETECTION_WINDOW_MS,
        }, 'navigation', {
            formId: this.formId,
            schemaVersion: this.schemaVersion,
            stepId: recentSteps[recentSteps.length - 1],
            sensitive: false,
        });
    }
}
//# sourceMappingURL=FormAnalytics.js.map