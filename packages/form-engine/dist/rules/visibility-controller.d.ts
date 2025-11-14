import type { JSONSchema, Rule, RuleContext, UnifiedFormSchema } from '../types';
import { RuleEvaluator } from './rule-evaluator';
export declare class VisibilityController {
    private evaluator;
    private visibilityCache;
    private stepCache;
    constructor(evaluator?: RuleEvaluator);
    private registerDefaultFunctions;
    isVisible(elementId: string, rule: Rule | undefined, data: any, context?: RuleContext): boolean;
    getVisibleFields(schema: UnifiedFormSchema, stepId: string, data: any, context?: RuleContext): string[];
    getVisibleSteps(schema: UnifiedFormSchema, data: any, context?: RuleContext): string[];
    isFieldVisible(schema: JSONSchema, data: any, context?: RuleContext): boolean;
    clearCache(): void;
    private resolveSchema;
    private getCacheKey;
}
//# sourceMappingURL=visibility-controller.d.ts.map