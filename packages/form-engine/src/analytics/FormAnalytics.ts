export interface AnalyticsEvent {
  name: string;
  data: unknown;
  timestamp: number;
  sessionId: string;
}

export class FormAnalytics {
  private events: AnalyticsEvent[] = [];

  initialize(formId: string, schemaVersion: string): void {
    this.trackEvent('form_viewed', { formId, schemaVersion });
    this.initPerformanceMonitoring();
  }

  trackEvent(eventName: string, data: unknown, sensitive = false): void {
    const payload = sensitive ? this.sanitizeData(data) : data;
    const event: AnalyticsEvent = {
      name: eventName,
      data: payload,
      timestamp: Date.now(),
      sessionId: this.getSessionId()
    };
    this.events.push(event);
    this.dispatch(event).catch(error => console.error('Failed to send analytics event', error));
  }

  measureStepTransition(from: string, to: string): () => void {
    if (typeof performance === 'undefined') {
      return () => undefined;
    }
    const markName = `step_${from}_to_${to}`;
    performance.mark(`${markName}_start`);
    return () => {
      performance.mark(`${markName}_end`);
      performance.measure(markName, `${markName}_start`, `${markName}_end`);
    };
  }

  private async dispatch(event: AnalyticsEvent): Promise<void> {
    if (typeof fetch === 'undefined') {
      return;
    }
    try {
      await fetch('/api/analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(event)
      });
    } catch (error) {
      console.warn('Analytics dispatch failed', error);
    }
  }

  private initPerformanceMonitoring(): void {
    if (typeof PerformanceObserver === 'undefined') {
      return;
    }
    const observer = new PerformanceObserver(list => {
      for (const entry of list.getEntries()) {
        if (entry.entryType === 'measure') {
          this.trackEvent('performance', {
            metric: entry.name,
            duration: entry.duration,
            start: entry.startTime
          });
          if (entry.duration > 150) {
            console.warn(`Performance threshold exceeded for ${entry.name}`);
          }
        }
      }
    });
    observer.observe({ entryTypes: ['measure'] });
  }

  private sanitizeData(data: unknown): unknown {
    if (typeof data !== 'object' || data === null) {
      return data;
    }
    return Object.keys(data as Record<string, unknown>).reduce<Record<string, unknown>>((acc, key) => {
      acc[key] = '[redacted]';
      return acc;
    }, {});
  }

  private getSessionId(): string {
    if (typeof window === 'undefined') {
      return 'server-session';
    }
    const existing = window.sessionStorage.getItem('cml-form-session');
    if (existing) {
      return existing;
    }
    const id = crypto.randomUUID();
    window.sessionStorage.setItem('cml-form-session', id);
    return id;
  }
}
