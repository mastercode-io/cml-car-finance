import type { FieldErrors } from 'react-hook-form';
import type { FormStep, JSONSchema, UnifiedFormSchema } from '../types';
export type StepStatus = 'completed' | 'current' | 'upcoming' | 'error';
export declare function resolveStepSchema(step: FormStep, schema: UnifiedFormSchema): JSONSchema;
export declare function getStepFieldNames(step: FormStep, schema: UnifiedFormSchema): string[];
export declare function getStepStatus(stepId: string, currentStep: string | undefined, completedSteps: string[], errorSteps: Set<string>): StepStatus;
export interface FlattenedFieldError {
    name: string;
    message?: string;
}
export declare function flattenFieldErrors(errors: FieldErrors, parentPath?: string): FlattenedFieldError[];
export declare function scrollToFirstError(): void;
//# sourceMappingURL=utils.d.ts.map