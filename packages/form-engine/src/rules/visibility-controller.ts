import type { JSONSchema, UnifiedFormSchema } from '../types';
import { evaluateRule, RuleEvaluator } from './rule-evaluator';

export class VisibilityController {
  private evaluator: RuleEvaluator;
  private stepCache: Map<string, string[]> = new Map();

  constructor(evaluator: RuleEvaluator = new RuleEvaluator()) {
    this.evaluator = evaluator;
  }

  getVisibleSteps(schema: UnifiedFormSchema, data: any): string[] {
    const cacheKey = JSON.stringify(data ?? {});
    const cached = this.stepCache.get(cacheKey);
    if (cached) {
      return cached;
    }
    const steps = schema.steps
      .filter(step => !step.visibleWhen || this.evaluator.evaluate(step.visibleWhen, data))
      .map(step => step.id);
    this.stepCache.set(cacheKey, steps);
    return steps;
  }

  isFieldVisible(schema: JSONSchema, data: any): boolean {
    if (!schema['x-visibility']) {
      return true;
    }
    return evaluateRule(schema['x-visibility'], data);
  }

  clearCache(): void {
    this.stepCache.clear();
    this.evaluator.clearCache();
  }
}
