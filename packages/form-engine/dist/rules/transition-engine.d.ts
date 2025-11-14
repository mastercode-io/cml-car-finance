import type { TransitionContext, TransitionHistoryEntry, UnifiedFormSchema } from '../types';
import { RuleEvaluator } from './rule-evaluator';
export declare class TransitionEngine {
    private evaluator;
    private history;
    private visibility;
    constructor(evaluator?: RuleEvaluator);
    getNextStep(schema: UnifiedFormSchema, currentStep: string, data: any, context?: TransitionContext): string | null;
    getPreviousStep(schema: UnifiedFormSchema, currentStep: string, data: any, context?: TransitionContext): string | null;
    canTransition(schema: UnifiedFormSchema, from: string, to: string, data: any, context?: TransitionContext): boolean;
    getTransitionPath(schema: UnifiedFormSchema, startStep: string, endStep: string, data: any, maxSteps?: number, context?: TransitionContext): string[];
    getTransitionHistory(): TransitionHistoryEntry[];
    clearHistory(): void;
    private recordTransition;
    private getAllVisibleSteps;
}
//# sourceMappingURL=transition-engine.d.ts.map