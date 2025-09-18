jest.mock('web-vitals', () => ({
  onCLS: jest.fn(),
  onFCP: jest.fn(),
  onINP: jest.fn(),
  onLCP: jest.fn(),
  onTTFB: jest.fn(),
}));

import { PerformanceBudget } from '../../../src/performance/PerformanceBudget';

describe('PerformanceBudget', () => {
  let budget: PerformanceBudget;

  beforeEach(() => {
    jest.clearAllMocks();
    budget = new PerformanceBudget({
      stepTransition: 100,
      validation: 30,
    });
  });

  it('detects budget violations', () => {
    const consoleSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => undefined as unknown as void);

    const passed = budget.checkBudget('stepTransition', 150);

    expect(passed).toBe(false);
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('Performance budget violation'),
      expect.any(Object),
    );
  });

  it('tracks violations for reporting', () => {
    budget.setBudget('validation', 30);
    budget.checkBudget('validation', 50);
    budget.checkBudget('stepTransition', 200);

    const violations = budget.getViolations();
    expect(violations).toHaveLength(2);
    expect(violations[0].metric).toBe('validation');
    expect(violations[1].metric).toBe('stepTransition');
  });

  it('generates human readable report', () => {
    budget.setBudget('validation', 30);
    budget.checkBudget('validation', 50);

    const report = budget.generateReport();
    expect(report).toContain('Performance Budget Report');
    expect(report).toContain('Violations: 1');
    expect(report).toContain('validation: 50ms (budget: 30ms)');
  });
});
