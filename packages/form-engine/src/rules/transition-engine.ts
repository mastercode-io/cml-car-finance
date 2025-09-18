import type { TransitionContext, TransitionHistoryEntry, UnifiedFormSchema } from '../types';
import { RuleEvaluator } from './rule-evaluator';
import { VisibilityController } from './visibility-controller';

export class TransitionEngine {
  private evaluator: RuleEvaluator;
  private history: TransitionHistoryEntry[] = [];
  private visibility: VisibilityController;

  constructor(evaluator: RuleEvaluator = new RuleEvaluator()) {
    this.evaluator = evaluator;
    this.visibility = new VisibilityController(this.evaluator);
  }

  getNextStep(
    schema: UnifiedFormSchema,
    currentStep: string,
    data: any,
    context?: TransitionContext,
  ): string | null {
    const transitions = schema.transitions.filter((transition) => transition.from === currentStep);

    if (transitions.length === 0) {
      return this.getDefaultNextStep(schema, currentStep);
    }

    const sorted = [...transitions].sort((a, b) => {
      if (a.default && !b.default) return 1;
      if (!a.default && b.default) return -1;
      return 0;
    });

    for (const transition of sorted) {
      if (transition.default) {
        this.recordTransition(currentStep, transition.to, 'default');
        return transition.to;
      }

      if (transition.when && !this.evaluator.evaluate(transition.when, data, context)) {
        continue;
      }

      if (transition.guard && context?.guards) {
        const guardFn = context.guards[transition.guard];
        if (guardFn) {
          const guardResult = guardFn(data, context);
          if (guardResult === false) {
            continue;
          }
        }
      }

      this.recordTransition(currentStep, transition.to, 'conditional');
      return transition.to;
    }

    return null;
  }

  getPreviousStep(
    schema: UnifiedFormSchema,
    currentStep: string,
    data: any,
    context?: TransitionContext,
  ): string | null {
    const visibleSteps = this.getAllVisibleSteps(schema, data, context);
    const currentIndex = visibleSteps.indexOf(currentStep);

    if (currentIndex > 0) {
      return visibleSteps[currentIndex - 1];
    }

    return null;
  }

  canTransition(
    schema: UnifiedFormSchema,
    from: string,
    to: string,
    data: any,
    context?: TransitionContext,
  ): boolean {
    const next = this.getNextStep(schema, from, data, context);
    return next === to;
  }

  getTransitionPath(
    schema: UnifiedFormSchema,
    startStep: string,
    endStep: string,
    data: any,
    maxSteps = 20,
    context?: TransitionContext,
  ): string[] {
    const path: string[] = [startStep];
    let currentStep = startStep;
    let stepsTaken = 0;

    while (currentStep !== endStep && stepsTaken < maxSteps) {
      const nextStep = this.getNextStep(schema, currentStep, data, context);
      if (!nextStep) {
        return [];
      }

      path.push(nextStep);
      currentStep = nextStep;
      stepsTaken += 1;
    }

    if (currentStep !== endStep) {
      return [];
    }

    return path;
  }

  getTransitionHistory(): TransitionHistoryEntry[] {
    return [...this.history];
  }

  clearHistory(): void {
    this.history = [];
  }

  private recordTransition(from: string, to: string, type: 'default' | 'conditional'): void {
    this.history.push({
      from,
      to,
      type,
      timestamp: Date.now(),
    });

    if (this.history.length > 100) {
      this.history.shift();
    }
  }

  private getAllVisibleSteps(
    schema: UnifiedFormSchema,
    data: any,
    context?: TransitionContext,
  ): string[] {
    return this.visibility.getVisibleSteps(schema, data, context);
  }

  private getDefaultNextStep(schema: UnifiedFormSchema, currentStep: string): string | null {
    const steps = schema.steps;
    const currentIndex = steps.findIndex((step) => step.id === currentStep);

    if (currentIndex >= 0 && currentIndex < steps.length - 1) {
      return steps[currentIndex + 1].id;
    }

    return null;
  }
}
