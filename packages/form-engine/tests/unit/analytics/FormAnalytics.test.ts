import { performance as nodePerformance } from 'perf_hooks';

import { FormAnalytics } from '../../../src/analytics/FormAnalytics';
import { DEFAULT_PAYLOAD_VERSION } from '../../../src/persistence/PersistenceManager';
import type { AnalyticsEvent, FormAnalyticsConfig } from '../../../src/types';

const perf = globalThis.performance as Performance | undefined;
if (!perf || typeof perf.mark !== 'function') {
  Object.defineProperty(globalThis, 'performance', {
    configurable: true,
    value: nodePerformance as unknown as Performance,
  });
}

describe('FormAnalytics', () => {
  let analytics: FormAnalytics | null;
  const initialNodeEnv = process.env.NODE_ENV;
  const initialSamplingEnv = process.env.NEXT_PUBLIC_FORM_ANALYTICS_SAMPLING;

  const createConfig = (overrides: Partial<FormAnalyticsConfig> = {}): FormAnalyticsConfig => ({
    enabled: true,
    sensitive: true,
    bufferSize: 50,
    flushInterval: 0,
    formId: 'test-form',
    schemaVersion: '2024.09.0',
    payloadVersion: DEFAULT_PAYLOAD_VERSION,
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
    process.env.NODE_ENV = initialNodeEnv;
    if (typeof initialSamplingEnv === 'string') {
      process.env.NEXT_PUBLIC_FORM_ANALYTICS_SAMPLING = initialSamplingEnv;
    } else {
      delete process.env.NEXT_PUBLIC_FORM_ANALYTICS_SAMPLING;
    }
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

    randomSpy.mockRestore();
  });

  it('defaults to 1% sampling in production when unset', () => {
    analytics?.destroy();
    process.env.NODE_ENV = 'production';
    delete process.env.NEXT_PUBLIC_FORM_ANALYTICS_SAMPLING;

    const randomSpy = jest.spyOn(Math, 'random');
    analytics = new FormAnalytics(createConfig());

    randomSpy.mockReturnValue(0.5);
    analytics?.trackEvent('skipped_event');
    expect((analytics as unknown as { events: AnalyticsEvent[] }).events).toHaveLength(0);

    randomSpy.mockReturnValue(0.009);
    analytics?.trackEvent('captured_event');
    const events = (analytics as unknown as { events: AnalyticsEvent[] }).events;
    expect(events).toHaveLength(1);
    expect(events[0]?.name).toBe('captured_event');

    randomSpy.mockRestore();
  });

  it('allows environment overrides for sampling rate', () => {
    analytics?.destroy();
    process.env.NODE_ENV = 'production';
    process.env.NEXT_PUBLIC_FORM_ANALYTICS_SAMPLING = '0.25';

    const randomSpy = jest.spyOn(Math, 'random');
    analytics = new FormAnalytics(createConfig());

    randomSpy.mockReturnValue(0.2);
    analytics?.trackEvent('tracked_event');
    const events = (analytics as unknown as { events: AnalyticsEvent[] }).events;
    expect(events).toHaveLength(1);
    expect(events[0]?.name).toBe('tracked_event');

    randomSpy.mockRestore();
  });

  it('attaches version metadata to tracked events', () => {
    analytics?.trackEvent(
      'form_initialized',
      { formId: 'test-form', schemaVersion: '2024.09.0' },
      'form',
      { formId: 'test-form', schemaVersion: '2024.09.0', sensitive: false },
    );

    const events = (analytics as unknown as { events: Array<AnalyticsEvent> })?.events ?? [];
    expect(events[0]?.v).toBe(1);
    expect(events[0]?.payloadVersion).toBe(DEFAULT_PAYLOAD_VERSION);
    expect(events[0]?.formId).toBe('test-form');
    expect(events[0]?.schemaVersion).toBe('2024.09.0');
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