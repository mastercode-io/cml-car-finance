import type { JSONSchema, StepValidationOptions, StepValidationResult, ValidationOptions, ValidationResult } from '../types';
import { ValidationEngine } from './ajv-setup';
interface ValidationExecutor {
    validate(schema: JSONSchema, data: unknown, options?: ValidationOptions): Promise<ValidationResult>;
    compile?(schema: JSONSchema): Promise<void> | void;
}
export declare class StepValidator {
    private engine;
    private worker?;
    private stepSchemas;
    constructor(engine?: ValidationEngine, worker?: ValidationExecutor);
    attachWorker(executor: ValidationExecutor | null | undefined): void;
    registerStep(stepId: string, schema: JSONSchema): void;
    validateStep(stepId: string, data: unknown, options?: StepValidationOptions): Promise<StepValidationResult>;
    validateAllSteps(data: unknown, options?: StepValidationOptions): Promise<Map<string, StepValidationResult>>;
    private shouldUseWorker;
    private extractWarnings;
}
export {};
//# sourceMappingURL=step-validator.d.ts.map