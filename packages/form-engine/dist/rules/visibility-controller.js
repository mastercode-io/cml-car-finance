import { RuleEvaluator } from './rule-evaluator';
export class VisibilityController {
    evaluator;
    visibilityCache = new Map();
    stepCache = new Map();
    constructor(evaluator = new RuleEvaluator()) {
        this.evaluator = evaluator;
        this.registerDefaultFunctions();
    }
    registerDefaultFunctions() {
        this.evaluator.registerCustomFunction('isWeekday', () => {
            const day = new Date().getDay();
            return day >= 1 && day <= 5;
        });
        this.evaluator.registerCustomFunction('hasRole', (data, args) => {
            const userRoles = data?.user?.roles ?? [];
            const requiredRole = args?.[0];
            return typeof requiredRole === 'string' && userRoles.includes(requiredRole);
        });
        this.evaluator.registerCustomFunction('isComplete', (data, args) => {
            const stepId = args?.[0];
            const completedSteps = data?._meta?.completedSteps ?? [];
            return typeof stepId === 'string' ? completedSteps.includes(stepId) : false;
        });
    }
    isVisible(elementId, rule, data, context) {
        if (!rule) {
            return true;
        }
        const cacheKey = this.getCacheKey(elementId, data, context);
        const cached = this.visibilityCache.get(cacheKey);
        if (cached !== undefined) {
            return cached;
        }
        try {
            const result = this.evaluator.evaluate(rule, data, context);
            this.visibilityCache.set(cacheKey, result);
            return result;
        }
        catch (error) {
            console.error(`Error evaluating visibility for ${elementId}:`, error);
            return true;
        }
    }
    getVisibleFields(schema, stepId, data, context) {
        const step = schema.steps.find((candidate) => candidate.id === stepId);
        if (!step) {
            return [];
        }
        const stepSchema = this.resolveSchema(step.schema, schema);
        const visibleFields = [];
        if (stepSchema.properties) {
            for (const [fieldName, fieldSchema] of Object.entries(stepSchema.properties)) {
                const visibilityRule = fieldSchema['x-visibility'];
                if (this.isVisible(fieldName, visibilityRule, data, context)) {
                    visibleFields.push(fieldName);
                }
            }
        }
        return visibleFields;
    }
    getVisibleSteps(schema, data, context) {
        const cacheKey = this.getCacheKey('steps', data, context);
        const cached = this.stepCache.get(cacheKey);
        if (cached) {
            return cached;
        }
        const steps = schema.steps
            .filter((step) => this.isVisible(step.id, step.visibleWhen, data, context))
            .map((step) => step.id);
        this.stepCache.set(cacheKey, steps);
        return steps;
    }
    isFieldVisible(schema, data, context) {
        const visibilitySchema = schema;
        return this.isVisible('field', visibilitySchema['x-visibility'], data, context);
    }
    clearCache() {
        this.visibilityCache.clear();
        this.stepCache.clear();
        this.evaluator.clearCache();
    }
    resolveSchema(schema, parentSchema) {
        if ('$ref' in schema && typeof schema.$ref === 'string') {
            const refPath = schema.$ref.replace('#/', '');
            const parts = refPath.split('/');
            let resolved = parentSchema;
            for (const part of parts) {
                resolved = resolved?.[part];
            }
            return (resolved ?? {});
        }
        return schema;
    }
    getCacheKey(elementId, data, context) {
        return `${elementId}::${JSON.stringify(data ?? {})}::${JSON.stringify(context ?? {})}`;
    }
}
//# sourceMappingURL=visibility-controller.js.map