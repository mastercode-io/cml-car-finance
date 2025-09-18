import type { ComparisonRule, CustomRule, Rule, RuleContext } from '../types';

export class RuleEvaluator {
  private customFunctions: Map<string, (data: any, args?: unknown[], context?: RuleContext) => boolean> = new Map();
  private cache: Map<string, boolean> = new Map();
  private evaluationCount = 0;
  private maxEvaluations = 1000;

  evaluate(rule: Rule, data: any, context?: RuleContext): boolean {
    this.evaluationCount += 1;
    if (this.evaluationCount > this.maxEvaluations) {
      throw new Error('Maximum rule evaluations exceeded');
    }
    const cacheKey = this.getCacheKey(rule, data);
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }
    const result = this.evaluateRule(rule, data, context);
    this.cache.set(cacheKey, result);
    return result;
  }

  clearCache(): void {
    this.cache.clear();
    this.evaluationCount = 0;
  }

  registerFunction(name: string, fn: (data: any, args?: unknown[], context?: RuleContext) => boolean): void {
    this.customFunctions.set(name, fn);
  }

  private evaluateRule(rule: Rule, data: any, context?: RuleContext): boolean {
    switch (rule.op) {
      case 'always':
        return 'value' in rule ? Boolean((rule as any).value) : true;
      case 'eq':
        return this.evaluateComparison(rule as ComparisonRule, data, (a, b) => a === b);
      case 'neq':
        return this.evaluateComparison(rule as ComparisonRule, data, (a, b) => a !== b);
      case 'gt':
        return this.evaluateComparison(rule as ComparisonRule, data, (a, b) => Number(a) > Number(b));
      case 'lt':
        return this.evaluateComparison(rule as ComparisonRule, data, (a, b) => Number(a) < Number(b));
      case 'gte':
        return this.evaluateComparison(rule as ComparisonRule, data, (a, b) => Number(a) >= Number(b));
      case 'lte':
        return this.evaluateComparison(rule as ComparisonRule, data, (a, b) => Number(a) <= Number(b));
      case 'in':
        return this.evaluateIn(rule as ComparisonRule, data);
      case 'regex':
        return this.evaluateRegex(rule as ComparisonRule, data);
      case 'and':
        return (rule as any).args.every((child: Rule) => this.evaluate(child, data, context));
      case 'or':
        return (rule as any).args.some((child: Rule) => this.evaluate(child, data, context));
      case 'not':
        return !(rule as any).args.length ? true : !this.evaluate((rule as any).args[0], data, context);
      case 'custom':
        return this.evaluateCustom(rule as CustomRule, data, context);
      default:
        throw new Error(`Unknown rule operator: ${(rule as any).op}`);
    }
  }

  private evaluateComparison(
    rule: ComparisonRule,
    data: any,
    compare: (left: any, right: any) => boolean
  ): boolean {
    const leftValue = this.resolveValue(rule.left, data);
    const rightValue = this.resolveValue(rule.right, data);
    if (leftValue === undefined || leftValue === null) {
      return false;
    }
    return compare(leftValue, rightValue);
  }

  private evaluateIn(rule: ComparisonRule, data: any): boolean {
    const leftValue = this.resolveValue(rule.left, data);
    const rightValue = this.resolveValue(rule.right, data);
    if (!Array.isArray(rightValue)) {
      throw new Error('Right side of "in" operator must be an array');
    }
    return rightValue.includes(leftValue);
  }

  private evaluateRegex(rule: ComparisonRule, data: any): boolean {
    const leftValue = this.resolveValue(rule.left, data);
    const pattern = this.resolveValue(rule.right, data);
    if (typeof leftValue !== 'string') {
      return false;
    }
    const regex = typeof pattern === 'string' ? new RegExp(pattern) : pattern;
    return regex.test(leftValue);
  }

  private evaluateCustom(rule: CustomRule, data: any, context?: RuleContext): boolean {
    const fn = this.customFunctions.get(rule.fn);
    if (!fn) {
      throw new Error(`Unknown custom function: ${rule.fn}`);
    }
    return fn(data, rule.args, context);
  }

  private resolveValue(path: any, data: any): any {
    if (typeof path !== 'string') {
      return path;
    }
    if (path.startsWith('$.')) {
      return path
        .slice(2)
        .split('.')
        .reduce((acc: any, key) => (acc == null ? undefined : acc[key]), data);
    }
    if (path.startsWith('@')) {
      return this.resolveContextValue(path);
    }
    return path;
  }

  private resolveContextValue(path: string): unknown {
    const contextValues: Record<string, unknown> = {
      '@now': new Date(),
      '@today': new Date().toISOString().split('T')[0],
      '@env': typeof process !== 'undefined' ? process.env.NODE_ENV : 'production'
    };
    return contextValues[path];
  }

  private getCacheKey(rule: Rule, data: any): string {
    return `${JSON.stringify(rule)}::${JSON.stringify(data)}`;
  }
}

const sharedEvaluator = new RuleEvaluator();

export const evaluateRule = (rule: Rule, data: any, context?: RuleContext) =>
  sharedEvaluator.evaluate(rule, data, context);
