import type { PerformanceBudgets, PerformanceBudgetViolation } from '../types';
type BudgetMetric = keyof PerformanceBudgets | string;
type BudgetUnit = 'ms' | 'bytes' | 'count';
export declare class PerformanceBudget {
    private budgets;
    private violations;
    constructor(overrides?: PerformanceBudgets);
    setBudget(metric: keyof PerformanceBudgets, limit: number): void;
    checkBudget(metric: BudgetMetric, value: number, unit?: BudgetUnit, context?: Record<string, any>): boolean;
    getViolations(): PerformanceBudgetViolation[];
    generateReport(): string;
    recordBundleSize(bytes: number): void;
    reset(): void;
    private initWebVitalTracking;
    private notifyMonitoringEndpoint;
}
export {};
//# sourceMappingURL=PerformanceBudget.d.ts.map