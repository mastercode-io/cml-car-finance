import type {
  AnalyticsEvent,
  FormAnalyticsConfig,
  PerformanceMetric,
  SessionMetrics,
} from '../types';

interface TrackEventOptions
  extends Partial<
    Pick<AnalyticsEvent, 'category' | 'formId' | 'schemaVersion' | 'stepId' | 'fieldName'>
  > {
  sensitive?: boolean;
}

const DEFAULT_CONFIG: Required<
  Pick<FormAnalyticsConfig, 'sampling' | 'sensitive' | 'bufferSize' | 'flushInterval'>
> = {
  sampling: 1,
  sensitive: true,
  bufferSize: 25,
  flushInterval: 8000,
};

export class FormAnalytics {
  private events: AnalyticsEvent[] = [];
  private sessionId: string;
  private config: FormAnalyticsConfig;
  private performanceObserver?: PerformanceObserver;
  private sessionMetrics: SessionMetrics;
  private flushTimer?: ReturnType<typeof setInterval>;
  private listenersAttached = false;

  constructor(config: FormAnalyticsConfig) {
    this.config = {
      ...DEFAULT_CONFIG,
      ...config,
    };

    this.sessionId = this.generateSessionId();
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

  trackEvent(
    eventName: string,
    data: Record<string, any> = {},
    category?: AnalyticsEvent['category'],
    options: TrackEventOptions = {},
  ): void {
    if (!this.config.enabled || !this.shouldTrack()) {
      return;
    }

    const shouldSanitize = options.sensitive ?? this.config.sensitive ?? false;
    const payload = shouldSanitize ? this.sanitizeData(data) : data;

    const event: AnalyticsEvent = {
      name: eventName,
      category: options.category ?? category,
      data: payload,
      timestamp: Date.now(),
      sessionId: this.sessionId,
      formId: options.formId ?? (typeof data.formId === 'string' ? data.formId : undefined),
      schemaVersion:
        options.schemaVersion ??
        (typeof data.schemaVersion === 'string' ? data.schemaVersion : undefined),
      stepId: options.stepId ?? (typeof data.stepId === 'string' ? data.stepId : undefined),
      fieldName:
        options.fieldName ?? (typeof data.fieldName === 'string' ? data.fieldName : undefined),
    };

    this.events.push(event);
    this.updateSessionMetrics(eventName, data);

    if (this.config.bufferSize && this.events.length >= this.config.bufferSize) {
      if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
        window.requestIdleCallback(() => {
          void this.flush();
        });
      } else {
        void this.flush();
      }
    }
  }

  measureStepTransition(from: string, to: string): (() => void) | undefined {
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

  measureValidation(stepId: string): (() => void) | undefined {
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

  getSessionId(): string {
    return this.sessionId;
  }

  getSessionMetrics(): SessionMetrics {
    return { ...this.sessionMetrics, completedSteps: [...this.sessionMetrics.completedSteps] };
  }

  destroy(): void {
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

  private initialize(): void {
    this.initPerformanceMonitoring();
    this.initEventListeners();
    this.startFlushTimer();
  }

  private shouldTrack(): boolean {
    const sampling = this.config.sampling ?? 1;
    if (sampling >= 1) {
      return true;
    }

    if (sampling <= 0) {
      return false;
    }

    return Math.random() <= sampling;
  }

  private updateSessionMetrics(eventName: string, data: Record<string, any>): void {
    switch (eventName) {
      case 'step_completed':
        if (
          typeof data.stepId === 'string' &&
          !this.sessionMetrics.completedSteps.includes(data.stepId)
        ) {
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

  private sanitizeData(data: any): any {
    const sensitiveKeys = ['email', 'phone', 'ssn', 'creditcard', 'credit_card', 'password'];

    const sanitizeValue = (value: any, path = ''): any => {
      if (Array.isArray(value)) {
        return value.map((item, index) => sanitizeValue(item, `${path}.${index}`));
      }

      if (value && typeof value === 'object') {
        return Object.entries(value).reduce<Record<string, any>>((acc, [key, val]) => {
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

  private initPerformanceMonitoring(): void {
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
    } catch (error) {
      console.warn('Performance monitoring not available:', error);
    }
  }

  private trackPerformanceEntry(entry: PerformanceEntry): void {
    if (!this.config.enabled) {
      return;
    }

    const metric: PerformanceMetric = {
      name: entry.name,
      value: 'duration' in entry ? (entry as PerformanceEntry & { duration: number }).duration : 0,
      unit: 'ms',
      timestamp: entry.startTime ?? Date.now(),
      metadata: {
        entryType: entry.entryType,
        detail:
          typeof (entry as PerformanceEntry & { toJSON?: () => unknown }).toJSON === 'function'
            ? (entry as PerformanceEntry & { toJSON: () => unknown }).toJSON()
            : undefined,
      },
    };

    if (this.config.performanceBudgets) {
      this.checkPerformanceBudget(entry);
    }

    this.trackEvent('performance_metric', metric, 'performance', { sensitive: false });
  }

  private checkPerformanceBudget(entry: PerformanceEntry): void {
    const budgets = this.config.performanceBudgets;
    if (!budgets) {
      return;
    }

    const duration =
      'duration' in entry ? (entry as PerformanceEntry & { duration: number }).duration : undefined;
    if (duration === undefined) {
      return;
    }

    let budget: number | undefined;
    type BudgetKey = keyof NonNullable<FormAnalyticsConfig['performanceBudgets']>;
    let metricKey: BudgetKey | undefined;

    if (entry.name.includes('step_')) {
      budget = budgets.stepTransition;
      metricKey = 'stepTransition';
    } else if (entry.name.includes('validation_')) {
      budget = budgets.validation;
      metricKey = 'validation';
    } else if (entry.entryType === 'navigation') {
      budget = budgets.initialLoad;
      metricKey = 'initialLoad';
    }

    if (budget && duration > budget) {
      console.warn(
        `⚠️ Performance budget exceeded for ${metricKey}: ${duration.toFixed(2)}ms (budget: ${budget}ms)`,
      );
      this.trackEvent(
        'performance_budget_exceeded',
        {
          metric: metricKey,
          actual: duration,
          budget,
          exceeded: duration - budget,
        },
        'performance',
        { sensitive: false },
      );
    }
  }

  private initEventListeners(): void {
    if (
      this.listenersAttached ||
      typeof document === 'undefined' ||
      typeof window === 'undefined'
    ) {
      return;
    }

    document.addEventListener('visibilitychange', this.handleVisibilityChange);
    window.addEventListener('beforeunload', this.handleUnload);
    this.listenersAttached = true;

    this.trackEvent(
      'form_viewed',
      {
        url: typeof window !== 'undefined' ? window.location.href : undefined,
        referrer: typeof document !== 'undefined' ? document.referrer : undefined,
      },
      'navigation',
    );
  }

  private handleVisibilityChange = (): void => {
    if (!this.config.enabled) {
      return;
    }

    if (typeof document !== 'undefined' && document.hidden) {
      this.trackEvent(
        'form_hidden',
        {
          duration: Date.now() - this.sessionMetrics.startTime,
        },
        'navigation',
      );
      void this.flush();
    } else {
      this.trackEvent('form_visible', {}, 'navigation');
    }
  };

  private handleUnload = (): void => {
    if (!this.config.enabled) {
      return;
    }

    this.sessionMetrics.endTime = Date.now();
    this.trackEvent('session_end', this.sessionMetrics, 'navigation');
    this.sendBeacon();
  };

  private startFlushTimer(): void {
    if (!this.config.flushInterval || this.config.flushInterval <= 0) {
      return;
    }

    this.flushTimer = setInterval(() => {
      void this.flush();
    }, this.config.flushInterval);
  }

  private async flush(): Promise<void> {
    if (!this.config.enabled || this.events.length === 0) {
      return;
    }

    const eventsToSend = [...this.events];
    this.events = [];

    try {
      await this.sendEvents(eventsToSend);
    } catch (error) {
      console.error('Failed to send analytics:', error);
      this.events.unshift(...eventsToSend);
    }
  }

  private async sendEvents(events: AnalyticsEvent[]): Promise<void> {
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
        events,
        sessionId: this.sessionId,
        timestamp: Date.now(),
      }),
    });

    if (!response.ok) {
      throw new Error(`Analytics API error: ${response.status}`);
    }
  }

  private sendBeacon(): void {
    if (
      typeof navigator === 'undefined' ||
      typeof navigator.sendBeacon !== 'function' ||
      !this.config.endpoint
    ) {
      return;
    }

    const payload = JSON.stringify({
      events: this.events,
      sessionId: this.sessionId,
      sessionMetrics: this.sessionMetrics,
    });

    navigator.sendBeacon(this.config.endpoint, payload);
  }

  private generateSessionId(): string {
    if (typeof window === 'undefined') {
      return `session_${Date.now()}`;
    }

    const storageKey = 'cml-form-session';
    try {
      const existing = window.sessionStorage.getItem(storageKey);
      if (existing) {
        return existing;
      }
      const id =
        typeof crypto !== 'undefined' && 'randomUUID' in crypto
          ? crypto.randomUUID()
          : this.randomId();
      window.sessionStorage.setItem(storageKey, id);
      return id;
    } catch (error) {
      console.warn('Unable to access sessionStorage for analytics session id', error);
      return this.randomId();
    }
  }

  private randomId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
  }
}
