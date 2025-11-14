import { ValidationEngine } from './ajv-setup';
export class StepValidator {
    engine;
    worker;
    stepSchemas = new Map();
    constructor(engine, worker) {
        this.engine = engine ?? new ValidationEngine();
        this.worker = worker;
    }
    attachWorker(executor) {
        this.worker = executor ?? undefined;
    }
    registerStep(stepId, schema) {
        this.stepSchemas.set(stepId, schema);
        void this.worker?.compile?.(schema);
    }
    async validateStep(stepId, data, options) {
        const schema = this.stepSchemas.get(stepId);
        if (!schema) {
            throw new Error(`No schema found for step: ${stepId}`);
        }
        const stepData = options?.fullData ? extractStepData(data, schema) : data;
        let executor = this.engine;
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
    async validateAllSteps(data, options) {
        const results = new Map();
        for (const stepId of this.stepSchemas.keys()) {
            const result = await this.validateStep(stepId, data, {
                ...options,
                fullData: true,
            });
            results.set(stepId, result);
        }
        return results;
    }
    shouldUseWorker(options) {
        return Boolean((options?.useWorker ?? true) && this.worker);
    }
    extractWarnings(errors) {
        return errors.filter((error) => error.keyword === 'warning' || error.params?.severity === 'warning');
    }
}
function extractStepData(data, schema) {
    if (data === null || typeof data !== 'object') {
        return data;
    }
    const source = data;
    if (!schema.properties) {
        return source;
    }
    const result = {};
    for (const [key, propertySchema] of Object.entries(schema.properties)) {
        if (!(key in source))
            continue;
        const value = source[key];
        if (propertySchema &&
            propertySchema.type === 'object' &&
            propertySchema.properties &&
            value &&
            typeof value === 'object' &&
            !Array.isArray(value)) {
            result[key] = extractStepData(value, propertySchema);
        }
        else {
            result[key] = value;
        }
    }
    return result;
}
//# sourceMappingURL=step-validator.js.map