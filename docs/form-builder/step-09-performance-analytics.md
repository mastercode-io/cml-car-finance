# Step 9: Performance & Analytics

## Step Description
Implement comprehensive performance monitoring and analytics tracking for the form engine. This step adds instrumentation to measure form interactions, performance metrics, and user behavior while maintaining privacy standards.

## Prerequisites
- Step 8 (Computed Fields) completed
- Form renderer with event handling
- Performance Observer API understanding
- Analytics service endpoint configured
- Privacy/GDPR compliance requirements understood

## Detailed To-Do List

### 9.1 Install Required Dependencies
```bash
npm install --save web-vitals
npm install --save-dev @types/gtag.js
```

### 9.2 Create Analytics Types
```typescript
// src/types/analytics.types.ts

export interface AnalyticsEvent {
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
  sampling?: number;          // 0-1, percentage of events to track
  sensitive?: boolean;         // Whether to sanitize PII
  bufferSize?: number;        // Events to buffer before sending
  flushInterval?: number;     // ms between batch sends
  performanceBudgets?: PerformanceBudgets;
}

export interface PerformanceBudgets {
  stepTransition?: number;    // ms
  validation?: number;         // ms
  initialLoad?: number;        // ms
  bundleSize?: number;        // bytes
  formCompletion?: number;    // ms
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
```

### 9.3 Implement Form Analytics Core
```typescript
// src/analytics/FormAnalytics.ts

export class FormAnalytics {
  private events: AnalyticsEvent[] = [];
  private sessionId: string;
  private config: FormAnalyticsConfig;
  private performanceObserver?: PerformanceObserver;
  private sessionMetrics: SessionMetrics;
  private flushTimer?: NodeJS.Timeout;
  
  constructor(config: FormAnalyticsConfig) {
    this.config = config;
    this.sessionId = this.generateSessionId();
    this.sessionMetrics = {
      startTime: Date.now(),
      completedSteps: [],
      errors: 0,
      validationAttempts: 0,
      fieldInteractions: 0
    };
    
    if (config.enabled) {
      this.initialize();
    }
  }
  
  private initialize(): void {
    this.initPerformanceMonitoring();
    this.initEventListeners();
    this.startFlushTimer();
    
    // Track page visibility changes
    document.addEventListener('visibilitychange', this.handleVisibilityChange);
    
    // Track page unload
    window.addEventListener('beforeunload', this.handleUnload);
  }
  
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  // Core event tracking
  trackEvent(
    eventName: string,
    data: any = {},
    category?: AnalyticsEvent['category']
  ): void {
    if (!this.config.enabled) return;
    
    // Apply sampling
    if (this.config.sampling && Math.random() > this.config.sampling) {
      return;
    }
    
    const event: AnalyticsEvent = {
      name: eventName,
      category: category || this.categorizeEvent(eventName),
      data: this.config.sensitive ? this.sanitizeData(data) : data,
      timestamp: Date.now(),
      sessionId: this.sessionId,
      formId: data.formId,
      schemaVersion: data.schemaVersion,
      stepId: data.stepId,
      fieldName: data.fieldName
    };
    
    this.events.push(event);
    
    // Flush if buffer is full
    if (this.events.length >= (this.config.bufferSize || 10)) {
      this.flush();
    }
    
    // Update session metrics
    this.updateSessionMetrics(eventName, data);
  }
  
  private categorizeEvent(eventName: string): AnalyticsEvent['category'] {
    if (eventName.includes('field')) return 'field';
    if (eventName.includes('step') || eventName.includes('navigation')) return 'navigation';
    if (eventName.includes('perf') || eventName.includes('performance')) return 'performance';
    if (eventName.includes('error')) return 'error';
    return 'form';
  }
  
  private updateSessionMetrics(eventName: string, data: any): void {
    switch (eventName) {
      case 'step_completed':
        if (!this.sessionMetrics.completedSteps.includes(data.stepId)) {
          this.sessionMetrics.completedSteps.push(data.stepId);
        }
        break;
      case 'validation_error':
        this.sessionMetrics.errors++;
        break;
      case 'validation_attempt':
        this.sessionMetrics.validationAttempts++;
        break;
      case 'field_changed':
        this.sessionMetrics.fieldInteractions++;
        break;
      case 'form_abandoned':
        this.sessionMetrics.abandonedAt = data.stepId;
        this.sessionMetrics.endTime = Date.now();
        break;
    }
  }
  
  // Sanitization for sensitive data
  private sanitizeData(data: any): any {
    const sensitive = ['email', 'phone', 'ssn', 'creditCard', 'password'];
    const sanitized = { ...data };
    
    const sanitizeValue = (obj: any, path: string = ''): any => {
      if (typeof obj !== 'object' || obj === null) {
        // Check if field name suggests sensitive data
        const fieldName = path.split('.').pop() || '';
        if (sensitive.some(s => fieldName.toLowerCase().includes(s))) {
          return '[REDACTED]';
        }
        return obj;
      }
      
      const result: any = Array.isArray(obj) ? [] : {};
      
      for (const [key, value] of Object.entries(obj)) {
        const currentPath = path ? `${path}.${key}` : key;
        result[key] = sanitizeValue(value, currentPath);
      }
      
      return result;
    };
    
    return sanitizeValue(sanitized);
  }
  
  // Performance monitoring
  private initPerformanceMonitoring(): void {
    if (!('PerformanceObserver' in window)) return;
    
    try {
      this.performanceObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.trackPerformanceEntry(entry);
        }
      });
      
      // Observe different entry types
      this.performanceObserver.observe({ 
        entryTypes: ['measure', 'navigation', 'resource', 'paint']
      });
    } catch (error) {
      console.warn('Performance monitoring not available:', error);
    }
  }
  
  private trackPerformanceEntry(entry: PerformanceEntry): void {
    const metric: PerformanceMetric = {
      name: entry.name,
      value: entry.duration || 0,
      unit: 'ms',
      timestamp: entry.startTime
    };
    
    // Check against budgets
    if (this.config.performanceBudgets) {
      this.checkPerformanceBudget(entry);
    }
    
    this.trackEvent('performance_metric', metric, 'performance');
  }
  
  private checkPerformanceBudget(entry: PerformanceEntry): void {
    const budgets = this.config.performanceBudgets!;
    let budget: number | undefined;
    let metricType: string = '';
    
    if (entry.name.includes('step_transition')) {
      budget = budgets.stepTransition;
      metricType = 'Step Transition';
    } else if (entry.name.includes('validation')) {
      budget = budgets.validation;
      metricType = 'Validation';
    } else if (entry.name === 'load') {
      budget = budgets.initialLoad;
      metricType = 'Initial Load';
    }
    
    if (budget && entry.duration > budget) {
      console.warn(
        `⚠️ Performance budget exceeded for ${metricType}: ` +
        `${entry.duration.toFixed(2)}ms (budget: ${budget}ms)`
      );
      
      this.trackEvent('performance_budget_exceeded', {
        metric: metricType,
        actual: entry.duration,
        budget: budget,
        exceeded: entry.duration - budget
      }, 'performance');
    }
  }
  
  // Manual performance measurements
  measureStepTransition(from: string, to: string): () => void {
    const markName = `step_${from}_to_${to}`;
    performance.mark(`${markName}_start`);
    
    return () => {
      performance.mark(`${markName}_end`);
      performance.measure(
        markName,
        `${markName}_start`,
        `${markName}_end`
      );
      
      // Clean up marks
      performance.clearMarks(`${markName}_start`);
      performance.clearMarks(`${markName}_end`);
    };
  }
  
  measureValidation(stepId: string): () => void {
    const markName = `validation_${stepId}`;
    performance.mark(`${markName}_start`);
    
    return () => {
      performance.mark(`${markName}_end`);
      performance.measure(
        markName,
        `${markName}_start`,
        `${markName}_end`
      );
      
      performance.clearMarks(`${markName}_start`);
      performance.clearMarks(`${markName}_end`);
    };
  }
  
  // Event listeners
  private initEventListeners(): void {
    // Track form visibility
    this.trackEvent('form_viewed', {
      url: window.location.href,
      referrer: document.referrer,
      screenSize: `${window.screen.width}x${window.screen.height}`,
      viewport: `${window.innerWidth}x${window.innerHeight}`
    });
  }
  
  private handleVisibilityChange = (): void => {
    if (document.hidden) {
      this.trackEvent('form_hidden', {
        duration: Date.now() - this.sessionMetrics.startTime
      });
      this.flush();
    } else {
      this.trackEvent('form_visible', {});
    }
  };
  
  private handleUnload = (): void => {
    this.sessionMetrics.endTime = Date.now();
    this.trackEvent('session_end', this.sessionMetrics);
    
    // Use sendBeacon for reliable delivery
    this.sendBeacon();
  };
  
  // Batch sending
  private startFlushTimer(): void {
    if (this.config.flushInterval) {
      this.flushTimer = setInterval(() => {
        this.flush();
      }, this.config.flushInterval);
    }
  }
  
  private async flush(): Promise<void> {
    if (this.events.length === 0) return;
    
    const eventsToSend = [...this.events];
    this.events = [];
    
    try {
      await this.sendEvents(eventsToSend);
    } catch (error) {
      console.error('Failed to send analytics:', error);
      // Re-queue events
      this.events.unshift(...eventsToSend);
    }
  }
  
  private async sendEvents(events: AnalyticsEvent[]): Promise<void> {
    if (!this.config.endpoint) {
      console.log('Analytics events:', events);
      return;
    }
    
    const response = await fetch(this.config.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        events,
        sessionId: this.sessionId,
        timestamp: Date.now()
      })
    });
    
    if (!response.ok) {
      throw new Error(`Analytics API error: ${response.status}`);
    }
  }
  
  private sendBeacon(): void {
    if (!navigator.sendBeacon || !this.config.endpoint) return;
    
    const data = JSON.stringify({
      events: this.events,
      sessionId: this.sessionId,
      sessionMetrics: this.sessionMetrics
    });
    
    navigator.sendBeacon(this.config.endpoint, data);
  }
  
  // Public API
  getSessionId(): string {
    return this.sessionId;
  }
  
  getSessionMetrics(): SessionMetrics {
    return { ...this.sessionMetrics };
  }
  
  destroy(): void {
    if (this.performanceObserver) {
      this.performanceObserver.disconnect();
    }
    
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }
    
    document.removeEventListener('visibilitychange', this.handleVisibilityChange);
    window.removeEventListener('beforeunload', this.handleUnload);
    
    this.flush();
  }
}
```

### 9.4 Create Performance Budget Manager
```typescript
// src/performance/PerformanceBudget.ts

import { getCLS, getFID, getLCP, getFCP, getTTFB } from 'web-vitals';

export class PerformanceBudget {
  private budgets: PerformanceBudgets = {
    stepTransition: 150,
    validation: 50,
    initialLoad: 500,
    bundleSize: 150 * 1024,
    formCompletion: 30000 // 30 seconds
  };
  
  private violations: Array<{
    metric: string;
    actual: number;
    budget: number;
    timestamp: number;
  }> = [];
  
  constructor(customBudgets?: Partial<PerformanceBudgets>) {
    this.budgets = { ...this.budgets, ...customBudgets };
    this.initWebVitals();
  }
  
  private initWebVitals(): void {
    // Core Web Vitals
    getCLS((metric) => this.checkMetric('CLS', metric.value, 0.1));
    getFID((metric) => this.checkMetric('FID', metric.value, 100));
    getLCP((metric) => this.checkMetric('LCP', metric.value, 2500));
    getFCP((metric) => this.checkMetric('FCP', metric.value, 1800));
    getTTFB((metric) => this.checkMetric('TTFB', metric.value, 800));
  }
  
  checkBudget(metric: keyof PerformanceBudgets, value: number): boolean {
    const budget = this.budgets[metric];
    if (!budget) return true;
    
    const passed = value <= budget;
    
    if (!passed) {
      this.reportViolation(metric, value, budget);
    }
    
    return passed;
  }
  
  private checkMetric(name: string, value: number, threshold: number): void {
    if (value > threshold) {
      this.reportViolation(name, value, threshold);
    }
  }
  
  private reportViolation(
    metric: string,
    actual: number,
    budget: number
  ): void {
    const violation = {
      metric,
      actual,
      budget,
      timestamp: Date.now()
    };
    
    this.violations.push(violation);
    
    console.error(
      `📊 Performance budget violation:\n` +
      `  Metric: ${metric}\n` +
      `  Actual: ${actual}${typeof actual === 'number' ? 'ms' : ''}\n` +
      `  Budget: ${budget}${typeof budget === 'number' ? 'ms' : ''}\n` +
      `  Exceeded by: ${actual - budget}`
    );
    
    // Report to monitoring service
    this.sendToMonitoring(violation);
  }
  
  private sendToMonitoring(violation: any): void {
    // Integration with Sentry, DataDog, etc.
    if (window.Sentry) {
      window.Sentry.captureMessage(
        `Performance budget violation: ${violation.metric}`,
        'warning'
      );
    }
    
    // Custom monitoring endpoint
    if (window.MONITORING_ENDPOINT) {
      fetch(window.MONITORING_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(violation)
      }).catch(console.error);
    }
  }
  
  getViolations(): typeof this.violations {
    return [...this.violations];
  }
  
  generateReport(): string {
    const report = [
      '=== Performance Budget Report ===',
      `Violations: ${this.violations.length}`,
      ''
    ];
    
    if (this.violations.length > 0) {
      report.push('Violations:');
      this.violations.forEach(v => {
        report.push(
          `  - ${v.metric}: ${v.actual}ms (budget: ${v.budget}ms)`
        );
      });
    } else {
      report.push('✅ All performance budgets met!');
    }
    
    return report.join('\n');
  }
}
```

### 9.5 Create React Hooks for Analytics
```typescript
// src/hooks/useFormAnalytics.ts

import { useEffect, useRef, useCallback } from 'react';
import { FormAnalytics } from '@/analytics/FormAnalytics';
import { PerformanceBudget } from '@/performance/PerformanceBudget';

export function useFormAnalytics(
  formId: string,
  schemaVersion: string,
  config?: Partial<FormAnalyticsConfig>
) {
  const analyticsRef = useRef<FormAnalytics>();
  const performanceRef = useRef<PerformanceBudget>();
  
  useEffect(() => {
    analyticsRef.current = new FormAnalytics({
      enabled: true,
      sampling: 1.0,
      sensitive: true,
      bufferSize: 10,
      flushInterval: 5000,
      ...config
    });
    
    performanceRef.current = new PerformanceBudget(
      config?.performanceBudgets
    );
    
    // Track form initialization
    analyticsRef.current.trackEvent('form_initialized', {
      formId,
      schemaVersion
    });
    
    return () => {
      analyticsRef.current?.destroy();
    };
  }, [formId, schemaVersion]);
  
  const trackStepView = useCallback((stepId: string) => {
    analyticsRef.current?.trackEvent('step_viewed', {
      formId,
      schemaVersion,
      stepId
    });
  }, [formId, schemaVersion]);
  
  const trackFieldInteraction = useCallback((
    fieldName: string,
    value: any,
    eventType: 'focus' | 'blur' | 'change'
  ) => {
    analyticsRef.current?.trackEvent(`field_${eventType}`, {
      formId,
      schemaVersion,
      fieldName,
      hasValue: !!value,
      valueLength: typeof value === 'string' ? value.length : undefined
    });
  }, [formId, schemaVersion]);
  
  const trackValidation = useCallback((
    stepId: string,
    errors: Record<string, any>,
    success: boolean
  ) => {
    const measure = analyticsRef.current?.measureValidation(stepId);
    
    // Perform validation...
    
    measure?.();
    
    analyticsRef.current?.trackEvent(
      success ? 'validation_success' : 'validation_error',
      {
        formId,
        schemaVersion,
        stepId,
        errorCount: Object.keys(errors).length,
        errorFields: Object.keys(errors)
      }
    );
  }, [formId, schemaVersion]);
  
  const trackSubmission = useCallback((
    success: boolean,
    data?: any,
    error?: Error
  ) => {
    analyticsRef.current?.trackEvent(
      success ? 'form_submitted' : 'submission_error',
      {
        formId,
        schemaVersion,
        success,
        error: error?.message,
        completionTime: Date.now() - (analyticsRef.current?.getSessionMetrics().startTime || 0)
      }
    );
  }, [formId, schemaVersion]);
  
  const measureStepTransition = useCallback((from: string, to: string) => {
    return analyticsRef.current?.measureStepTransition(from, to);
  }, []);
  
  return {
    trackStepView,
    trackFieldInteraction,
    trackValidation,
    trackSubmission,
    measureStepTransition,
    getSessionId: () => analyticsRef.current?.getSessionId(),
    getSessionMetrics: () => analyticsRef.current?.getSessionMetrics()
  };
}
```

### 9.6 Create Performance Monitoring Dashboard Component
```typescript
// src/components/PerformanceDashboard.tsx

import React, { useState, useEffect } from 'react';

export const PerformanceDashboard: React.FC<{
  show?: boolean;
}> = ({ show = false }) => {
  const [metrics, setMetrics] = useState<any>({});
  const [isVisible, setIsVisible] = useState(show);
  
  useEffect(() => {
    if (!isVisible) return;
    
    const interval = setInterval(() => {
      const navigation = performance.getEntriesByType('navigation')[0] as any;
      const measures = performance.getEntriesByType('measure');
      
      setMetrics({
        // Page metrics
        pageLoad: navigation?.loadEventEnd - navigation?.fetchStart,
        domReady: navigation?.domContentLoadedEventEnd - navigation?.fetchStart,
        
        // Form metrics
        stepTransitions: measures
          .filter(m => m.name.includes('step_'))
          .map(m => ({ name: m.name, duration: m.duration })),
        
        validations: measures
          .filter(m => m.name.includes('validation_'))
          .map(m => ({ name: m.name, duration: m.duration })),
        
        // Memory
        memory: (performance as any).memory ? {
          used: ((performance as any).memory.usedJSHeapSize / 1048576).toFixed(2),
          total: ((performance as any).memory.totalJSHeapSize / 1048576).toFixed(2)
        } : null
      });
    }, 1000);
    
    return () => clearInterval(interval);
  }, [isVisible]);
  
  if (!isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        style={{
          position: 'fixed',
          bottom: 10,
          right: 10,
          zIndex: 9999,
          padding: '5px 10px',
          background: '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer'
        }}
      >
        📊 Perf
      </button>
    );
  }
  
  return (
    <div
      style={{
        position: 'fixed',
        bottom: 10,
        right: 10,
        width: 300,
        maxHeight: 400,
        background: 'white',
        border: '1px solid #ddd',
        borderRadius: '4px',
        padding: '10px',
        zIndex: 9999,
        overflow: 'auto',
        fontSize: '12px',
        fontFamily: 'monospace'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <h4>Performance Monitor</h4>
        <button onClick={() => setIsVisible(false)}>×</button>
      </div>
      
      <div>
        <strong>Page Load:</strong> {metrics.pageLoad?.toFixed(2)}ms
      </div>
      <div>
        <strong>DOM Ready:</strong> {metrics.domReady?.toFixed(2)}ms
      </div>
      
      {metrics.memory && (
        <div>
          <strong>Memory:</strong> {metrics.memory.used}MB / {metrics.memory.total}MB
        </div>
      )}
      
      {metrics.stepTransitions?.length > 0 && (
        <div>
          <strong>Recent Transitions:</strong>
          {metrics.stepTransitions.slice(-5).map((m: any, i: number) => (
            <div key={i}>
              {m.name}: {m.duration.toFixed(2)}ms
            </div>
          ))}
        </div>
      )}
      
      {metrics.validations?.length > 0 && (
        <div>
          <strong>Recent Validations:</strong>
          {metrics.validations.slice(-5).map((m: any, i: number) => (
            <div key={i}>
              {m.name}: {m.duration.toFixed(2)}ms
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
```

## Test Cases

### Analytics Tests
```typescript
describe('FormAnalytics', () => {
  let analytics: FormAnalytics;
  
  beforeEach(() => {
    analytics = new FormAnalytics({
      enabled: true,
      sampling: 1.0,
      bufferSize: 5
    });
  });
  
  afterEach(() => {
    analytics.destroy();
  });
  
  it('should track events', () => {
    const spy = jest.spyOn(analytics as any, 'sendEvents');
    
    analytics.trackEvent('test_event', { data: 'test' });
    
    expect(analytics['events']).toHaveLength(1);
    expect(analytics['events'][0]).toMatchObject({
      name: 'test_event',
      data: { data: 'test' }
    });
  });
  
  it('should sanitize sensitive data', () => {
    analytics = new FormAnalytics({
      enabled: true,
      sensitive: true
    });
    
    analytics.trackEvent('form_data', {
      name: 'John',
      email: 'john@example.com',
      phone: '555-1234'
    });
    
    const event = analytics['events'][0];
    expect(event.data.name).toBe('John');
    expect(event.data.email).toBe('[REDACTED]');
    expect(event.data.phone).toBe('[REDACTED]');
  });
  
  it('should apply sampling', () => {
    analytics = new FormAnalytics({
      enabled: true,
      sampling: 0.5
    });
    
    // Mock Math.random
    const randomSpy = jest.spyOn(Math, 'random');
    
    randomSpy.mockReturnValue(0.3); // Should track
    analytics.trackEvent('event1');
    
    randomSpy.mockReturnValue(0.7); // Should not track
    analytics.trackEvent('event2');
    
    expect(analytics['events']).toHaveLength(1);
    expect(analytics['events'][0].name).toBe('event1');
  });
  
  it('should measure performance', () => {
    const measure = analytics.measureStepTransition('step1', 'step2');
    
    // Simulate some work
    const start = Date.now();
    while (Date.now() - start < 10);
    
    measure();
    
    const measures = performance.getEntriesByName('step_step1_to_step2');
    expect(measures).toHaveLength(1);
    expect(measures[0].duration).toBeGreaterThan(0);
  });
});
```

### Performance Budget Tests
```typescript
describe('PerformanceBudget', () => {
  let budget: PerformanceBudget;
  
  beforeEach(() => {
    budget = new PerformanceBudget({
      stepTransition: 100,
      validation: 30
    });
  });
  
  it('should detect budget violations', () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    
    const passed = budget.checkBudget('stepTransition', 150);
    
    expect(passed).toBe(false);
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('Performance budget violation')
    );
  });
  
  it('should track violations', () => {
    budget.checkBudget('validation', 50);
    budget.checkBudget('stepTransition', 200);
    
    const violations = budget.getViolations();
    expect(violations).toHaveLength(2);
    expect(violations[0].metric).toBe('validation');
    expect(violations[1].metric).toBe('stepTransition');
  });
  
  it('should generate report', () => {
    budget.checkBudget('validation', 50);
    
    const report = budget.generateReport();
    
    expect(report).toContain('Performance Budget Report');
    expect(report).toContain('Violations: 1');
    expect(report).toContain('validation: 50ms (budget: 30ms)');
  });
});
```

## Success Criteria
- ✅ Analytics events tracked with proper categorization
- ✅ Sensitive data sanitized before sending
- ✅ Performance metrics measured accurately
- ✅ Budget violations detected and reported
- ✅ Batch sending with configurable buffer
- ✅ Session metrics tracked throughout form lifecycle
- ✅ Web Vitals integration working
- ✅ Performance dashboard shows real-time metrics

## Implementation Notes

### Privacy Considerations
- Always sanitize PII before sending
- Implement user consent checks
- Provide opt-out mechanism
- Follow GDPR/CCPA requirements
- Hash user identifiers

### Performance Impact
- Use requestIdleCallback for non-critical tracking
- Batch events to reduce network calls
- Use sendBeacon for unload events
- Minimize performance observer overhead
- Debounce frequent events

### Error Handling
- Gracefully handle analytics failures
- Don't block form functionality
- Queue events during network issues
- Implement retry with exponential backoff

## Next Steps
With analytics and performance monitoring complete:
1. Implement migration tools (Step 10)
2. Create analytics dashboard UI
3. Add A/B testing support
4. Build funnel analysis tools
5. Create performance regression tests