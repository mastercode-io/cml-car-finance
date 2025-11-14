import type { Rule, RuleContext } from '../types';
type CustomRuleFn = (data: any, args?: unknown[], context?: RuleContext) => boolean;
export declare class RuleEvaluator {
    private customFunctions;
    private cache;
    private evaluationCount;
    private maxEvaluations;
    evaluate(rule: Rule, data: any, context?: RuleContext): boolean;
    clearCache(): void;
    registerCustomFunction(name: string, fn: CustomRuleFn): void;
    private evaluateRule;
    private evaluateComparison;
    private evaluateIn;
    private evaluateRegex;
    private evaluateCustom;
    private resolveValue;
    private resolveContextValue;
    private coerceTypes;
    private getCacheKey;
}
export declare const evaluateRule: (rule: Rule, data: any, context?: RuleContext) => boolean;
export {};
//# sourceMappingURL=rule-evaluator.d.ts.map