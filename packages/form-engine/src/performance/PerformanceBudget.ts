export interface BudgetCheckResult {
  name: string;
  duration: number;
  limit: number;
  withinBudget: boolean;
}

export class PerformanceBudget {
  private budgets: Record<string, number> = {
    stepTransition: 150,
    validation: 50,
    render: 100
  };

  setBudget(metric: string, limit: number): void {
    this.budgets[metric] = limit;
  }

  check(metric: string, duration: number): BudgetCheckResult {
    const limit = this.budgets[metric] ?? 0;
    const withinBudget = limit === 0 ? true : duration <= limit;
    if (!withinBudget) {
      console.warn(`Performance budget exceeded for ${metric}: ${duration}ms > ${limit}ms`);
    }
    return {
      name: metric,
      duration,
      limit,
      withinBudget
    };
  }
}
