import type { JSONSchema, Rule, RuleContext, UnifiedFormSchema } from '../types';
import { RuleEvaluator } from './rule-evaluator';

type VisibilityRuleSchema = JSONSchema & { 'x-visibility'?: Rule };

export class VisibilityController {
  private evaluator: RuleEvaluator;
  private visibilityCache: Map<string, boolean> = new Map();
  private stepCache: Map<string, string[]> = new Map();

  constructor(evaluator: RuleEvaluator = new RuleEvaluator()) {
    this.evaluator = evaluator;
    this.registerDefaultFunctions();
  }

  private registerDefaultFunctions(): void {
    this.evaluator.registerCustomFunction('isWeekday', () => {
      const day = new Date().getDay();
      return day >= 1 && day <= 5;
    });

    this.evaluator.registerCustomFunction('hasRole', (data, args) => {
      const userRoles = (data?.user?.roles as string[] | undefined) ?? [];
      const requiredRole = args?.[0];
      return typeof requiredRole === 'string' && userRoles.includes(requiredRole);
    });

    this.evaluator.registerCustomFunction('isComplete', (data, args) => {
      const stepId = args?.[0];
      const completedSteps = (data?._meta?.completedSteps as string[] | undefined) ?? [];
      return typeof stepId === 'string' ? completedSteps.includes(stepId) : false;
    });
  }

  isVisible(elementId: string, rule: Rule | undefined, data: any, context?: RuleContext): boolean {
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
    } catch (error) {
      console.error(`Error evaluating visibility for ${elementId}:`, error);
      return true;
    }
  }

  getVisibleFields(
    schema: UnifiedFormSchema,
    stepId: string,
    data: any,
    context?: RuleContext,
  ): string[] {
    const step = schema.steps.find((candidate) => candidate.id === stepId);
    if (!step) {
      return [];
    }

    const stepSchema = this.resolveSchema(step.schema, schema);
    const visibleFields: string[] = [];

    if (stepSchema.properties) {
      for (const [fieldName, fieldSchema] of Object.entries(stepSchema.properties)) {
        const visibilityRule = (fieldSchema as VisibilityRuleSchema)['x-visibility'];
        if (this.isVisible(fieldName, visibilityRule, data, context)) {
          visibleFields.push(fieldName);
        }
      }
    }

    return visibleFields;
  }

  getVisibleSteps(schema: UnifiedFormSchema, data: any, context?: RuleContext): string[] {
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

  isFieldVisible(schema: JSONSchema, data: any, context?: RuleContext): boolean {
    const visibilitySchema = schema as VisibilityRuleSchema;
    return this.isVisible('field', visibilitySchema['x-visibility'], data, context);
  }

  clearCache(): void {
    this.visibilityCache.clear();
    this.stepCache.clear();
    this.evaluator.clearCache();
  }

  private resolveSchema(
    schema: JSONSchema | { $ref: string },
    parentSchema: UnifiedFormSchema,
  ): JSONSchema {
    if ('$ref' in schema && typeof schema.$ref === 'string') {
      const refPath = schema.$ref.replace('#/', '');
      const parts = refPath.split('/');

      let resolved: any = parentSchema;
      for (const part of parts) {
        resolved = resolved?.[part];
      }

      return (resolved ?? {}) as JSONSchema;
    }

    return schema;
  }

  private getCacheKey(elementId: string, data: any, context?: RuleContext): string {
    return `${elementId}::${JSON.stringify(data ?? {})}::${JSON.stringify(context ?? {})}`;
  }
}
