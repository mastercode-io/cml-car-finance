import JSONPath from 'jsonpath';

import type { ComparisonRule, CustomRule, Rule, RuleContext } from '../types';

type CustomRuleFn = (data: any, args?: unknown[], context?: RuleContext) => boolean;

export class RuleEvaluator {
  private customFunctions: Map<string, CustomRuleFn> = new Map();
  private cache: Map<string, boolean> = new Map();
  private evaluationCount = 0;
  private maxEvaluations = 1000;

  evaluate(rule: Rule, data: any, context?: RuleContext): boolean {
    if (!rule) {
      return true;
    }

    this.evaluationCount += 1;
    if (this.evaluationCount > this.maxEvaluations) {
      throw new Error('Maximum rule evaluations exceeded');
    }

    const cacheKey = this.getCacheKey(rule, data, context);
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

  registerCustomFunction(name: string, fn: CustomRuleFn): void {
    this.customFunctions.set(name, fn);
  }

  private evaluateRule(rule: Rule, data: any, context?: RuleContext): boolean {
    switch (rule.op) {
      case 'always':
        return 'value' in rule ? Boolean((rule as any).value) : true;
      case 'eq':
        return this.evaluateComparison(rule as ComparisonRule, data, (a, b) => a === b, context);
      case 'neq':
        return this.evaluateComparison(rule as ComparisonRule, data, (a, b) => a !== b, context);
      case 'gt':
        return this.evaluateComparison(rule as ComparisonRule, data, (a, b) => a > b, context);
      case 'lt':
        return this.evaluateComparison(rule as ComparisonRule, data, (a, b) => a < b, context);
      case 'gte':
        return this.evaluateComparison(rule as ComparisonRule, data, (a, b) => a >= b, context);
      case 'lte':
        return this.evaluateComparison(rule as ComparisonRule, data, (a, b) => a <= b, context);
      case 'in':
        return this.evaluateIn(rule as ComparisonRule, data, context);
      case 'regex':
        return this.evaluateRegex(rule as ComparisonRule, data, context);
      case 'and':
        return (rule as any).args.every((child: Rule) => this.evaluate(child, data, context));
      case 'or':
        return (rule as any).args.some((child: Rule) => this.evaluate(child, data, context));
      case 'not':
        return !(rule as any).args.length
          ? true
          : !this.evaluate((rule as any).args[0], data, context);
      case 'custom':
        return this.evaluateCustom(rule as CustomRule, data, context);
      default:
        throw new Error(`Unknown rule operator: ${(rule as any).op}`);
    }
  }

  private evaluateComparison(
    rule: ComparisonRule,
    data: any,
    compare: (left: any, right: any) => boolean,
    context?: RuleContext,
  ): boolean {
    const leftValue = this.resolveValue(rule.left, data, context);
    const rightValue = this.resolveValue(rule.right, data, context);
    if (leftValue === undefined || leftValue === null) {
      return false;
    }

    const coerced = this.coerceTypes(leftValue, rightValue);
    return compare(coerced.left, coerced.right);
  }

  private evaluateIn(rule: ComparisonRule, data: any, context?: RuleContext): boolean {
    const leftValue = this.resolveValue(rule.left, data, context);
    const rightValue = this.resolveValue(rule.right, data, context);
    if (!Array.isArray(rightValue)) {
      throw new Error('Right side of "in" operator must be an array');
    }
    return rightValue.includes(leftValue);
  }

  private evaluateRegex(rule: ComparisonRule, data: any, context?: RuleContext): boolean {
    const leftValue = this.resolveValue(rule.left, data, context);
    const pattern = this.resolveValue(rule.right, data, context);
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

  private resolveValue(path: any, data: any, context?: RuleContext): any {
    if (typeof path !== 'string') {
      return path;
    }
    if (path.startsWith('$')) {
      const results = JSONPath.query(data, path);
      if (results.length === 0) {
        return undefined;
      }
      return results.length === 1 ? results[0] : results;
    }
    if (path.startsWith('@')) {
      return this.resolveContextValue(path, context);
    }
    return path;
  }

  private resolveContextValue(path: string, context?: RuleContext): unknown {
    if (context && path in context) {
      return (context as Record<string, unknown>)[path];
    }

    const contextValues: Record<string, unknown> = {
      '@now': new Date(),
      '@today': new Date().toISOString().split('T')[0],
      '@env': typeof process !== 'undefined' ? process.env.NODE_ENV : 'production',
    };
    return contextValues[path];
  }

  private coerceTypes(left: any, right: any): { left: any; right: any } {
    if (left instanceof Date || right instanceof Date) {
      return {
        left: left instanceof Date ? left : new Date(left),
        right: right instanceof Date ? right : new Date(right),
      };
    }

    const bothNumeric =
      (typeof left === 'number' || typeof right === 'number') &&
      !Number.isNaN(Number(left)) &&
      !Number.isNaN(Number(right));

    if (bothNumeric) {
      return {
        left: Number(left),
        right: Number(right),
      };
    }

    return {
      left: typeof left === 'string' ? left : String(left),
      right: typeof right === 'string' ? right : String(right),
    };
  }

  private getCacheKey(rule: Rule, data: any, context?: RuleContext): string {
    return `${JSON.stringify(rule)}::${JSON.stringify(data)}::${JSON.stringify(context ?? {})}`;
  }
}

const sharedEvaluator = new RuleEvaluator();

export const evaluateRule = (rule: Rule, data: any, context?: RuleContext) =>
  sharedEvaluator.evaluate(rule, data, context);
