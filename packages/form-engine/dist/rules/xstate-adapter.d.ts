import type { ComplexityAnalysis, UnifiedFormSchema } from '../types';
import { RuleEvaluator } from './rule-evaluator';
type FormMachineEvent = {
    type: 'NEXT';
} | {
    type: 'PREVIOUS';
} | {
    type: 'UPDATE_FIELD';
    field: string;
    value: unknown;
} | {
    type: 'VALIDATE';
} | {
    type: 'SUBMIT';
};
export declare class XStateAdapter {
    private evaluator;
    private complexityThreshold;
    constructor(evaluator?: RuleEvaluator);
    shouldUseXState(schema: UnifiedFormSchema): boolean;
    analyzeComplexity(schema: UnifiedFormSchema): ComplexityAnalysis;
    convertToStateMachine(schema: UnifiedFormSchema): import("xstate").StateMachine<{
        formData: {};
        currentStep: string;
        completedSteps: never[];
        errors: {};
        submissionState: {
            isSubmitting: boolean;
            submitted: boolean;
            submitCount: number;
            error: null;
        };
    }, FormMachineEvent>;
    private calculateComplexity;
    private getMaxNesting;
    private buildNextTransitions;
    private buildPreviousTransition;
    private buildGuards;
    private createGuardFromRule;
    private getPreviousStepId;
    private createAdvanceAction;
}
export {};
//# sourceMappingURL=xstate-adapter.d.ts.map