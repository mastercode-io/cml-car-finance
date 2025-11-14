import type { JSONSchema, StepValidationResult, ValidationError } from '../types';
interface ValidationState {
    isValidating: boolean;
    errors: ValidationError[];
    warnings: ValidationError[];
    isValid: boolean;
}
export interface StepValidationHook extends ValidationState {
    validate(data: unknown): Promise<boolean>;
    clearErrors(): void;
    lastResult?: StepValidationResult;
}
export declare function useStepValidation(stepId: string, schema: JSONSchema): StepValidationHook;
export {};
//# sourceMappingURL=useStepValidation.d.ts.map