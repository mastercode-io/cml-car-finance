import { onCLS, onFCP, onINP, onLCP, onTTFB } from 'web-vitals';

import type { PerformanceBudgets, PerformanceBudgetViolation } from '../types';

type BudgetMetric = keyof PerformanceBudgets | string;

type BudgetUnit = 'ms' | 'bytes' | 'count';

const DEFAULT_BUDGETS: PerformanceBudgets = {
  stepTransition: 150,
  validation: 50,
  initialLoad: 500,
  bundleSize: 150 * 1024,
  formCompletion: 5 * 60 * 1000,
};

export class PerformanceBudget {
  private budgets: PerformanceBudgets;
  private violations: PerformanceBudgetViolation[] = [];

  constructor(overrides?: PerformanceBudgets) {
    this.budgets = {
      ...DEFAULT_BUDGETS,
      ...overrides,
    };

    if (typeof window !== 'undefined') {
      this.initWebVitalTracking();
    }
  }

  setBudget(metric: keyof PerformanceBudgets, limit: number): void {
    this.budgets[metric] = limit;
  }

  checkBudget(
    metric: BudgetMetric,
    value: number,
    unit: BudgetUnit = 'ms',
    context: Record<string, any> = {},
  ): boolean {
    const limit = (this.budgets as Record<string, number | undefined>)[metric];
    if (limit === undefined || limit <= 0) {
      return true;
    }

    if (value <= limit) {
      return true;
    }

    const violation: PerformanceBudgetViolation = {
      metric: metric.toString(),
      actual: unit === 'ms' ? Number(value.toFixed(2)) : value,
      budget: limit,
      timestamp: Date.now(),
      severity: value > limit * 1.2 ? 'critical' : 'warning',
      context: { ...context, unit },
    };

    this.violations.push(violation);

    console.error(
      `Performance budget violation for ${violation.metric}: ${violation.actual}${unit} (budget: ${limit}${unit})`,
      context,
    );

    this.notifyMonitoringEndpoint(violation);

    return false;
  }

  getViolations(): PerformanceBudgetViolation[] {
    return [...this.violations];
  }

  generateReport(): string {
    const lines = ['=== Performance Budget Report ===', `Violations: ${this.violations.length}`];

    if (this.violations.length === 0) {
      lines.push('', '✅ All performance budgets met!');
      return lines.join('\n');
    }

    lines.push('', 'Violations:');
    for (const violation of this.violations) {
      const unit = violation.context?.unit ?? 'ms';
      lines.push(
        `  - ${violation.metric}: ${violation.actual}${unit} (budget: ${violation.budget}${unit})`,
      );
    }

    return lines.join('\n');
  }

  recordBundleSize(bytes: number): void {
    this.checkBudget('bundleSize', bytes, 'bytes');
  }

  reset(): void {
    this.violations = [];
  }

  private initWebVitalTracking(): void {
    const handler = (metric: { name: string; value: number }) => {
      switch (metric.name) {
        case 'FCP':
        case 'LCP':
        case 'TTFB':
          this.checkBudget('initialLoad', metric.value, 'ms', { metric: metric.name });
          break;
        case 'INP':
          this.checkBudget('stepTransition', metric.value, 'ms', { metric: metric.name });
          break;
        case 'CLS':
          this.checkBudget('validation', metric.value, 'count', { metric: metric.name });
          break;
        default:
          break;
      }
    };

    try {
      onCLS(handler);
      onINP(handler);
      onLCP(handler);
      onFCP(handler);
      onTTFB(handler);
    } catch (error) {
      console.warn('Unable to initialize web-vitals monitoring', error);
    }
  }

  private notifyMonitoringEndpoint(violation: PerformanceBudgetViolation): void {
    if (typeof window === 'undefined') {
      return;
    }

    const endpoint = (window as typeof window & { MONITORING_ENDPOINT?: string })
      .MONITORING_ENDPOINT;
    if (!endpoint || typeof fetch === 'undefined') {
      return;
    }

    fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(violation),
      keepalive: true,
    }).catch((error) => {
      console.warn('Failed to report performance budget violation', error);
    });
  }
}
