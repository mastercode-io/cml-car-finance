import type {
  JSONSchema,
  StepValidationOptions,
  StepValidationResult,
  ValidationError,
  ValidationOptions,
  ValidationResult,
} from '../types';
import { ValidationEngine } from './ajv-setup';

interface ValidationExecutor {
  validate(
    schema: JSONSchema,
    data: unknown,
    options?: ValidationOptions,
  ): Promise<ValidationResult>;
  compile?(schema: JSONSchema): Promise<void> | void;
}

export class StepValidator {
  private engine: ValidationEngine;
  private worker?: ValidationExecutor;
  private stepSchemas: Map<string, JSONSchema> = new Map();

  constructor(engine?: ValidationEngine, worker?: ValidationExecutor) {
    this.engine = engine ?? new ValidationEngine();
    this.worker = worker;
  }

  attachWorker(executor: ValidationExecutor | null | undefined): void {
    this.worker = executor ?? undefined;
  }

  registerStep(stepId: string, schema: JSONSchema): void {
    this.stepSchemas.set(stepId, schema);
    void this.worker?.compile?.(schema);
  }

  async validateStep(
    stepId: string,
    data: unknown,
    options?: StepValidationOptions,
  ): Promise<StepValidationResult> {
    const schema = this.stepSchemas.get(stepId);
    if (!schema) {
      throw new Error(`No schema found for step: ${stepId}`);
    }

    const stepData = options?.fullData ? extractStepData(data, schema) : data;
    let executor: ValidationExecutor | ValidationEngine = this.engine;
    if (this.shouldUseWorker(options) && this.worker) {
      executor = this.worker;
    }

    const result = await executor.validate(schema, stepData, {
      timeout: options?.timeout,
    });

    const warnings = this.extractWarnings(result.errors);
    const errors = result.errors.filter((error) => !warnings.includes(error));
    const shouldBlock = options?.blockOnError === true && !result.valid;

    return {
      ...result,
      errors,
      stepId,
      canProceed: shouldBlock ? false : true,
      warnings,
    };
  }

  async validateAllSteps(
    data: unknown,
    options?: StepValidationOptions,
  ): Promise<Map<string, StepValidationResult>> {
    const results = new Map<string, StepValidationResult>();

    for (const stepId of this.stepSchemas.keys()) {
      const result = await this.validateStep(stepId, data, {
        ...options,
        fullData: true,
      });
      results.set(stepId, result);
    }

    return results;
  }

  private shouldUseWorker(options?: StepValidationOptions): boolean {
    return Boolean((options?.useWorker ?? true) && this.worker);
  }

  private extractWarnings(errors: ValidationError[]): ValidationError[] {
    return errors.filter(
      (error) => error.keyword === 'warning' || error.params?.severity === 'warning',
    );
  }
}

function extractStepData(data: unknown, schema: JSONSchema): unknown {
  if (data === null || typeof data !== 'object') {
    return data;
  }

  const source = data as Record<string, unknown>;
  if (!schema.properties) {
    return source;
  }

  const result: Record<string, unknown> = {};
  for (const [key, propertySchema] of Object.entries(schema.properties)) {
    if (!(key in source)) continue;
    const value = source[key];

    if (
      propertySchema &&
      propertySchema.type === 'object' &&
      propertySchema.properties &&
      value &&
      typeof value === 'object' &&
      !Array.isArray(value)
    ) {
      result[key] = extractStepData(value, propertySchema);
    } else {
      result[key] = value;
    }
  }

  return result;
}
