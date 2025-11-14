import { onCLS, onFCP, onINP, onLCP, onTTFB } from 'web-vitals';
const DEFAULT_BUDGETS = {
    stepTransition: 150,
    validation: 50,
    initialLoad: 500,
    bundleSize: 150 * 1024,
    formCompletion: 5 * 60 * 1000,
};
export class PerformanceBudget {
    budgets;
    violations = [];
    constructor(overrides) {
        this.budgets = {
            ...DEFAULT_BUDGETS,
            ...overrides,
        };
        if (typeof window !== 'undefined') {
            this.initWebVitalTracking();
        }
    }
    setBudget(metric, limit) {
        this.budgets[metric] = limit;
    }
    checkBudget(metric, value, unit = 'ms', context = {}) {
        const limit = this.budgets[metric];
        if (limit === undefined || limit <= 0) {
            return true;
        }
        if (value <= limit) {
            return true;
        }
        const violation = {
            metric: metric.toString(),
            actual: unit === 'ms' ? Number(value.toFixed(2)) : value,
            budget: limit,
            timestamp: Date.now(),
            severity: value > limit * 1.2 ? 'critical' : 'warning',
            context: { ...context, unit },
        };
        this.violations.push(violation);
        console.error(`Performance budget violation for ${violation.metric}: ${violation.actual}${unit} (budget: ${limit}${unit})`, context);
        this.notifyMonitoringEndpoint(violation);
        return false;
    }
    getViolations() {
        return [...this.violations];
    }
    generateReport() {
        const lines = ['=== Performance Budget Report ===', `Violations: ${this.violations.length}`];
        if (this.violations.length === 0) {
            lines.push('', '✅ All performance budgets met!');
            return lines.join('\n');
        }
        lines.push('', 'Violations:');
        for (const violation of this.violations) {
            const unit = violation.context?.unit ?? 'ms';
            lines.push(`  - ${violation.metric}: ${violation.actual}${unit} (budget: ${violation.budget}${unit})`);
        }
        return lines.join('\n');
    }
    recordBundleSize(bytes) {
        this.checkBudget('bundleSize', bytes, 'bytes');
    }
    reset() {
        this.violations = [];
    }
    initWebVitalTracking() {
        const handler = (metric) => {
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
        }
        catch (error) {
            console.warn('Unable to initialize web-vitals monitoring', error);
        }
    }
    notifyMonitoringEndpoint(violation) {
        if (typeof window === 'undefined') {
            return;
        }
        const endpoint = window
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
//# sourceMappingURL=PerformanceBudget.js.map