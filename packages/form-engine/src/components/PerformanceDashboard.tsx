'use client';

import * as React from 'react';

interface PerformanceDashboardProps {
  show?: boolean;
}

interface DashboardMetrics {
  pageLoad?: number;
  domReady?: number;
  stepTransitions: Array<{ name: string; duration: number }>;
  validations: Array<{ name: string; duration: number }>;
  memory?: { used: string; total: string } | null;
}

const INITIAL_METRICS: DashboardMetrics = {
  stepTransitions: [],
  validations: [],
  memory: null,
};

export const PerformanceDashboard: React.FC<PerformanceDashboardProps> = ({ show = false }) => {
  const [metrics, setMetrics] = React.useState<DashboardMetrics>(INITIAL_METRICS);
  const [isVisible, setIsVisible] = React.useState(show);

  React.useEffect(() => {
    if (!isVisible || typeof performance === 'undefined') {
      return;
    }

    const interval = window.setInterval(() => {
      const navigation = performance.getEntriesByType('navigation')[0] as
        | PerformanceNavigationTiming
        | undefined;
      const measures = performance.getEntriesByType('measure');

      setMetrics({
        pageLoad:
          navigation && navigation.loadEventEnd && navigation.fetchStart
            ? navigation.loadEventEnd - navigation.fetchStart
            : undefined,
        domReady:
          navigation && navigation.domContentLoadedEventEnd && navigation.fetchStart
            ? navigation.domContentLoadedEventEnd - navigation.fetchStart
            : undefined,
        stepTransitions: measures
          .filter((measure) => measure.name.includes('step_'))
          .map((measure) => ({
            name: measure.name,
            duration: Number(measure.duration.toFixed(2)),
          })),
        validations: measures
          .filter((measure) => measure.name.includes('validation_'))
          .map((measure) => ({
            name: measure.name,
            duration: Number(measure.duration.toFixed(2)),
          })),
        memory: (
          performance as Performance & {
            memory?: { usedJSHeapSize: number; totalJSHeapSize: number };
          }
        ).memory
          ? {
              used: (
                ((performance as Performance & { memory: { usedJSHeapSize: number } }).memory
                  .usedJSHeapSize || 0) / 1048576
              ).toFixed(2),
              total: (
                ((performance as Performance & { memory: { totalJSHeapSize: number } }).memory
                  .totalJSHeapSize || 0) / 1048576
              ).toFixed(2),
            }
          : null,
      });
    }, 1000);

    return () => {
      window.clearInterval(interval);
    };
  }, [isVisible]);

  if (!isVisible) {
    return (
      <button
        type="button"
        onClick={() => setIsVisible(true)}
        style={{
          position: 'fixed',
          bottom: 16,
          right: 16,
          zIndex: 9999,
          padding: '6px 12px',
          background: '#2563eb',
          color: '#ffffff',
          border: 'none',
          borderRadius: 6,
          cursor: 'pointer',
          boxShadow: '0 4px 12px rgba(37, 99, 235, 0.4)',
        }}
        aria-label="Open performance dashboard"
      >
        📊 Perf
      </button>
    );
  }

  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        position: 'fixed',
        bottom: 16,
        right: 16,
        width: 320,
        maxHeight: 420,
        background: '#ffffff',
        border: '1px solid rgba(15, 23, 42, 0.12)',
        borderRadius: 8,
        padding: 12,
        zIndex: 9999,
        overflowY: 'auto',
        fontSize: 12,
        fontFamily: 'ui-monospace, SFMono-Regular, SFMono, Consolas',
        boxShadow: '0 10px 30px rgba(15, 23, 42, 0.12)',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 8,
        }}
      >
        <h4 style={{ margin: 0, fontSize: 14 }}>Performance Monitor</h4>
        <button
          type="button"
          onClick={() => setIsVisible(false)}
          aria-label="Close performance dashboard"
          style={{
            background: 'transparent',
            border: 'none',
            color: '#64748b',
            cursor: 'pointer',
            fontSize: 16,
            lineHeight: 1,
          }}
        >
          ×
        </button>
      </div>

      <section aria-label="Page metrics" style={{ marginBottom: 12 }}>
        <strong>Page</strong>
        <ul style={{ listStyle: 'none', padding: 0, margin: '6px 0 0' }}>
          <li>Load: {metrics.pageLoad ? `${metrics.pageLoad.toFixed(2)}ms` : '—'}</li>
          <li>DOM Ready: {metrics.domReady ? `${metrics.domReady.toFixed(2)}ms` : '—'}</li>
        </ul>
      </section>

      <section aria-label="Step transitions" style={{ marginBottom: 12 }}>
        <strong>Step Transitions</strong>
        {metrics.stepTransitions.length > 0 ? (
          <ul style={{ listStyle: 'none', padding: 0, margin: '6px 0 0' }}>
            {metrics.stepTransitions.map((step) => (
              <li key={step.name}>
                {step.name}: {step.duration}ms
              </li>
            ))}
          </ul>
        ) : (
          <p style={{ margin: '6px 0 0', color: '#94a3b8' }}>No measurements yet</p>
        )}
      </section>

      <section aria-label="Validation metrics" style={{ marginBottom: 12 }}>
        <strong>Validations</strong>
        {metrics.validations.length > 0 ? (
          <ul style={{ listStyle: 'none', padding: 0, margin: '6px 0 0' }}>
            {metrics.validations.map((validation) => (
              <li key={validation.name}>
                {validation.name}: {validation.duration}ms
              </li>
            ))}
          </ul>
        ) : (
          <p style={{ margin: '6px 0 0', color: '#94a3b8' }}>No validation metrics yet</p>
        )}
      </section>

      <section aria-label="Memory usage">
        <strong>Memory</strong>
        {metrics.memory ? (
          <ul style={{ listStyle: 'none', padding: 0, margin: '6px 0 0' }}>
            <li>Used: {metrics.memory.used} MB</li>
            <li>Total: {metrics.memory.total} MB</li>
          </ul>
        ) : (
          <p style={{ margin: '6px 0 0', color: '#94a3b8' }}>Memory metrics unavailable</p>
        )}
      </section>
    </div>
  );
};
