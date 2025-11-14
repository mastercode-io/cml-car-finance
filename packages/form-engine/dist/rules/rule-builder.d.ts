import type { ComparisonRule, CustomRule, LogicalRule, Rule } from '../types';
export declare class RuleBuilder {
    static equals(field: string, value: unknown): ComparisonRule;
    static notEquals(field: string, value: unknown): ComparisonRule;
    static greaterThan(field: string, value: unknown): ComparisonRule;
    static greaterThanOrEqual(field: string, value: unknown): ComparisonRule;
    static lessThan(field: string, value: unknown): ComparisonRule;
    static lessThanOrEqual(field: string, value: unknown): ComparisonRule;
    static in(field: string, values: unknown[]): ComparisonRule;
    static matches(field: string, pattern: string | RegExp): ComparisonRule;
    static and(...rules: Rule[]): LogicalRule;
    static or(...rules: Rule[]): LogicalRule;
    static not(rule: Rule): LogicalRule;
    static custom(functionName: string, ...args: unknown[]): CustomRule;
    static required(field: string): ComparisonRule;
    static optional(field: string): LogicalRule;
}
//# sourceMappingURL=rule-builder.d.ts.map