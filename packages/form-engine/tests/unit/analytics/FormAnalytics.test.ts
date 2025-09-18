import { performance as nodePerformance } from 'perf_hooks';

import { FormAnalytics } from '../../../src/analytics/FormAnalytics';
import type { FormAnalyticsConfig } from '../../../src/types';

const perf = globalThis.performance as Performance | undefined;
if (!perf || typeof perf.mark !== 'function') {
  Object.defineProperty(globalThis, 'performance', {
    configurable: true,
    value: nodePerformance as unknown as Performance,
  });
}

describe('FormAnalytics', () => {
  let analytics: FormAnalytics | null;

  const createConfig = (overrides: Partial<FormAnalyticsConfig> = {}): FormAnalyticsConfig => ({
    enabled: true,
    sampling: 1,
    sensitive: true,
    bufferSize: 50,
    flushInterval: 0,
    ...overrides,
  });

  beforeEach(() => {
    if (typeof performance.clearMarks === 'function') {
      performance.clearMarks();
    }
    if (typeof performance.clearMeasures === 'function') {
      performance.clearMeasures();
    }
    analytics = new FormAnalytics(createConfig());
  });

  afterEach(() => {
    analytics?.destroy();
    analytics = null;
    jest.restoreAllMocks();
  });

  it('sanitizes sensitive field values when tracking events', () => {
    analytics?.trackEvent('form_data', {
      name: 'John Doe',
      email: 'john@example.com',
      phone: '555-1234',
    });

    const events = (
      analytics as unknown as { events: Array<{ name: string; data: Record<string, unknown> }> }
    )?.events;
    const event = events?.find((entry) => entry.name === 'form_data');
    expect(event).toBeDefined();
    expect(event?.data.email).toBe('[REDACTED]');
    expect(event?.data.phone).toBe('[REDACTED]');
    expect(event?.data.name).toBe('John Doe');
  });

  it('honors sampling rate when recording events', () => {
    analytics?.destroy();
    const randomSpy = jest.spyOn(Math, 'random');
    analytics = new FormAnalytics(createConfig({ sampling: 0.5 }));

    randomSpy.mockReturnValue(0.3);
    analytics?.trackEvent('sampled_event');

    randomSpy.mockReturnValue(0.8);
    analytics?.trackEvent('skipped_event');

    const events = (analytics as unknown as { events: Array<{ name: string }> })?.events ?? [];
    const names = events.map((event) => event.name);
    expect(names).toContain('sampled_event');
    expect(names).not.toContain('skipped_event');
  });

  it('creates performance marks for step transitions', () => {
    const measure = analytics?.measureStepTransition('step1', 'step2');
    expect(typeof measure).toBe('function');

    if (!measure) {
      return;
    }

    const start = performance.now();
    while (performance.now() - start < 5) {
      // busy wait to create measurable duration
    }

    measure();

    const entries = performance.getEntriesByName('step_step1_to_step2');
    expect(entries.length).toBeGreaterThan(0);
    expect(entries[entries.length - 1]?.duration ?? 0).toBeGreaterThan(0);
  });
});
