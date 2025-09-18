import type { ComparisonRule, CustomRule, LogicalRule, Rule } from '../types';

const buildFieldPath = (field: string): string => (field.startsWith('$.') ? field : `$.${field}`);

export class RuleBuilder {
  static equals(field: string, value: unknown): ComparisonRule {
    return { op: 'eq', left: buildFieldPath(field), right: value };
  }

  static notEquals(field: string, value: unknown): ComparisonRule {
    return { op: 'neq', left: buildFieldPath(field), right: value };
  }

  static greaterThan(field: string, value: unknown): ComparisonRule {
    return { op: 'gt', left: buildFieldPath(field), right: value };
  }

  static greaterThanOrEqual(field: string, value: unknown): ComparisonRule {
    return { op: 'gte', left: buildFieldPath(field), right: value };
  }

  static lessThan(field: string, value: unknown): ComparisonRule {
    return { op: 'lt', left: buildFieldPath(field), right: value };
  }

  static lessThanOrEqual(field: string, value: unknown): ComparisonRule {
    return { op: 'lte', left: buildFieldPath(field), right: value };
  }

  static in(field: string, values: unknown[]): ComparisonRule {
    return { op: 'in', left: buildFieldPath(field), right: values };
  }

  static matches(field: string, pattern: string | RegExp): ComparisonRule {
    return { op: 'regex', left: buildFieldPath(field), right: pattern };
  }

  static and(...rules: Rule[]): LogicalRule {
    return { op: 'and', args: rules };
  }

  static or(...rules: Rule[]): LogicalRule {
    return { op: 'or', args: rules };
  }

  static not(rule: Rule): LogicalRule {
    return { op: 'not', args: [rule] };
  }

  static custom(functionName: string, ...args: unknown[]): CustomRule {
    return { op: 'custom', fn: functionName, args };
  }

  static required(field: string): ComparisonRule {
    return this.notEquals(field, null);
  }

  static optional(field: string): LogicalRule {
    return this.not(this.required(field));
  }
}
