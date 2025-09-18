import type { UnifiedFormSchema } from '../types';
import { evaluateRule } from './rule-evaluator';

export class TransitionEngine {
  getNextStep(schema: UnifiedFormSchema, currentStepId: string, data: any): string | null {
    const transitions = schema.transitions.filter(transition => transition.from === currentStepId);
    for (const transition of transitions) {
      if (!transition.when || evaluateRule(transition.when, data)) {
        return transition.to;
      }
    }
    const defaultTransition = transitions.find(transition => transition.default);
    return defaultTransition ? defaultTransition.to : null;
  }
}
