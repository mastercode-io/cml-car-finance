import { assign, createMachine } from 'xstate';

import type { ComplexityAnalysis, Rule, TransitionContext, UnifiedFormSchema } from '../types';
import { RuleEvaluator } from './rule-evaluator';

interface FormMachineContext {
  formData: Record<string, unknown>;
  currentStep: string;
  completedSteps: string[];
  errors: Record<string, unknown>;
}

type FormMachineEvent =
  | { type: 'NEXT' }
  | { type: 'PREVIOUS' }
  | { type: 'UPDATE_FIELD'; field: string; value: unknown }
  | { type: 'VALIDATE' }
  | { type: 'SUBMIT' };

export class XStateAdapter {
  private evaluator: RuleEvaluator;
  private complexityThreshold = {
    maxConditions: 8,
    maxNesting: 3,
    requiresAsync: false,
    requiresParallel: false,
    requiresAudit: false,
  };

  constructor(evaluator: RuleEvaluator = new RuleEvaluator()) {
    this.evaluator = evaluator;
  }

  shouldUseXState(schema: UnifiedFormSchema): boolean {
    const analysis = this.calculateComplexity(schema);

    return (
      analysis.uniqueConditions > this.complexityThreshold.maxConditions ||
      analysis.maxNesting > this.complexityThreshold.maxNesting ||
      analysis.hasAsyncGuards ||
      analysis.hasParallelStates ||
      schema.metadata.requiresAudit === true
    );
  }

  analyzeComplexity(schema: UnifiedFormSchema): ComplexityAnalysis {
    return this.calculateComplexity(schema);
  }

  convertToStateMachine(schema: UnifiedFormSchema) {
    const initialStep = schema.steps[0]?.id ?? 'complete';
    const states: Record<string, any> = {};

    for (const step of schema.steps) {
      states[step.id] = {
        on: {
          UPDATE_FIELD: {
            actions: 'updateField',
          },
          NEXT: this.buildNextTransitions(schema, step.id),
          PREVIOUS: this.buildPreviousTransition(schema, step.id),
        },
        meta: {
          stepSchema: step.schema,
          visibilityRule: step.visibleWhen,
        },
      };
    }

    states.complete = {
      type: 'final',
      entry: 'submitForm',
    };

    const machine = createMachine(
      {
        id: `formFlow_${schema.$id}`,
        initial: initialStep,
        context: {
          formData: {},
          currentStep: initialStep,
          completedSteps: [],
          errors: {},
        },
        states,
      },
      {
        actions: {
          updateField: assign({
            formData: (context: FormMachineContext, rawEvent: unknown) => {
              const event = rawEvent as FormMachineEvent | undefined;
              if (!event || event.type !== 'UPDATE_FIELD') {
                return context.formData;
              }

              return {
                ...context.formData,
                [event.field]: event.value,
              };
            },
          }),
          submitForm: () => {
            // Placeholder for async submission hook
          },
        },
        guards: this.buildGuards(schema) as any,
      },
    );

    return machine;
  }

  private calculateComplexity(schema: UnifiedFormSchema): ComplexityAnalysis {
    const conditions = new Set<string>();
    let maxNesting = 0;
    let hasAsyncGuards = false;

    for (const transition of schema.transitions) {
      if (transition.when) {
        conditions.add(JSON.stringify(transition.when));
        maxNesting = Math.max(maxNesting, this.getMaxNesting(transition.when));
      }

      if (transition.guard?.includes('async')) {
        hasAsyncGuards = true;
      }
    }

    const hasParallelStates = schema.steps.some((step) => (step as any).parallel === true);

    return {
      uniqueConditions: conditions.size,
      maxNesting,
      hasAsyncGuards,
      hasParallelStates,
    };
  }

  private getMaxNesting(rule: Rule, depth = 0): number {
    if (rule.op === 'and' || rule.op === 'or' || rule.op === 'not') {
      const childDepths = rule.args.map((child) => this.getMaxNesting(child, depth + 1));
      return Math.max(...childDepths);
    }

    return depth;
  }

  private buildNextTransitions(schema: UnifiedFormSchema, stepId: string) {
    const transitions = schema.transitions.filter((transition) => transition.from === stepId);

    if (transitions.length === 0) {
      const fallbackIndex = schema.steps.findIndex((step) => step.id === stepId) + 1;
      const fallbackTarget = schema.steps[fallbackIndex]?.id ?? 'complete';

      return [
        {
          target: fallbackTarget,
          actions: this.createAdvanceAction(stepId, fallbackTarget),
        },
      ];
    }

    return transitions.map((transition) => ({
      target: transition.to,
      guard: transition.guard ?? this.createGuardFromRule(transition.when),
      actions: this.createAdvanceAction(stepId, transition.to),
    }));
  }

  private buildPreviousTransition(schema: UnifiedFormSchema, stepId: string) {
    const previousId = this.getPreviousStepId(schema, stepId);

    if (!previousId) {
      return [];
    }

    return [
      {
        target: previousId,
        actions: assign({
          currentStep: () => previousId,
        }),
      },
    ];
  }

  private buildGuards(schema: UnifiedFormSchema) {
    const guards: Record<
      string,
      (context: FormMachineContext, event: FormMachineEvent) => boolean
    > = {
      always: () => true,
    };

    for (const transition of schema.transitions) {
      if (transition.when) {
        const guardName = this.createGuardFromRule(transition.when);
        if (!guards[guardName]) {
          guards[guardName] = (context, _event) =>
            this.evaluator.evaluate(
              transition.when!,
              context.formData,
              context as unknown as TransitionContext,
            );
        }
      }
    }

    return guards;
  }

  private createGuardFromRule(rule?: Rule): string {
    if (!rule) {
      return 'always';
    }

    return `guard_${JSON.stringify(rule)
      .replace(/[^a-zA-Z0-9]/g, '')
      .slice(0, 20)}`;
  }

  private getPreviousStepId(schema: UnifiedFormSchema, currentId: string): string | null {
    const index = schema.steps.findIndex((step) => step.id === currentId);
    if (index > 0) {
      return schema.steps[index - 1]?.id ?? null;
    }
    return null;
  }

  private createAdvanceAction(stepId: string, target: string) {
    return assign({
      currentStep: () => target,
      completedSteps: (context: FormMachineContext) =>
        context.completedSteps.includes(stepId)
          ? context.completedSteps
          : [...context.completedSteps, stepId],
    });
  }
}
