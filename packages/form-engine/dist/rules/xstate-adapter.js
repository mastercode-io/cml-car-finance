import { assign, createMachine } from 'xstate';
import { RuleEvaluator } from './rule-evaluator';
export class XStateAdapter {
    evaluator;
    complexityThreshold = {
        maxConditions: 8,
        maxNesting: 3,
        requiresAsync: false,
        requiresParallel: false,
        requiresAudit: false,
    };
    constructor(evaluator = new RuleEvaluator()) {
        this.evaluator = evaluator;
    }
    shouldUseXState(schema) {
        const analysis = this.calculateComplexity(schema);
        return (analysis.uniqueConditions > this.complexityThreshold.maxConditions ||
            analysis.maxNesting > this.complexityThreshold.maxNesting ||
            analysis.hasAsyncGuards ||
            analysis.hasParallelStates ||
            schema.metadata.requiresAudit === true);
    }
    analyzeComplexity(schema) {
        return this.calculateComplexity(schema);
    }
    convertToStateMachine(schema) {
        const initialStep = schema.steps[0]?.id ?? 'complete';
        const states = {};
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
        const machine = createMachine({
            id: `formFlow_${schema.$id}`,
            initial: initialStep,
            context: {
                formData: {},
                currentStep: initialStep,
                completedSteps: [],
                errors: {},
                submissionState: {
                    isSubmitting: false,
                    submitted: false,
                    submitCount: 0,
                    error: null,
                },
            },
            states,
        }, {
            actions: {
                updateField: assign({
                    formData: (context, rawEvent) => {
                        const event = rawEvent;
                        if (!event || event.type !== 'UPDATE_FIELD') {
                            return context.formData;
                        }
                        return {
                            ...context.formData,
                            [event.field]: event.value,
                        };
                    },
                }),
                submitForm: assign({
                    submissionState: (context) => ({
                        isSubmitting: false,
                        submitted: true,
                        submitCount: context.submissionState.submitCount + 1,
                        lastSubmittedAt: new Date().toISOString(),
                        error: null,
                    }),
                    errors: () => ({}),
                }),
            },
            guards: this.buildGuards(schema),
        });
        return machine;
    }
    calculateComplexity(schema) {
        const conditions = new Set();
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
        const hasParallelStates = schema.steps.some((step) => step.parallel === true);
        return {
            uniqueConditions: conditions.size,
            maxNesting,
            hasAsyncGuards,
            hasParallelStates,
        };
    }
    getMaxNesting(rule, depth = 0) {
        if (rule.op === 'and' || rule.op === 'or' || rule.op === 'not') {
            const childDepths = rule.args.map((child) => this.getMaxNesting(child, depth + 1));
            return Math.max(...childDepths);
        }
        return depth;
    }
    buildNextTransitions(schema, stepId) {
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
    buildPreviousTransition(schema, stepId) {
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
    buildGuards(schema) {
        const guards = {
            always: () => true,
        };
        for (const transition of schema.transitions) {
            if (transition.when) {
                const guardName = this.createGuardFromRule(transition.when);
                if (!guards[guardName]) {
                    guards[guardName] = (context, _event) => this.evaluator.evaluate(transition.when, context.formData, context);
                }
            }
        }
        return guards;
    }
    createGuardFromRule(rule) {
        if (!rule) {
            return 'always';
        }
        return `guard_${JSON.stringify(rule)
            .replace(/[^a-zA-Z0-9]/g, '')
            .slice(0, 20)}`;
    }
    getPreviousStepId(schema, currentId) {
        const index = schema.steps.findIndex((step) => step.id === currentId);
        if (index > 0) {
            return schema.steps[index - 1]?.id ?? null;
        }
        return null;
    }
    createAdvanceAction(stepId, target) {
        return assign({
            currentStep: () => target,
            completedSteps: (context) => context.completedSteps.includes(stepId)
                ? context.completedSteps
                : [...context.completedSteps, stepId],
            submissionState: (context) => target === 'complete'
                ? {
                    ...context.submissionState,
                    isSubmitting: true,
                    submitted: false,
                    error: null,
                }
                : context.submissionState,
        });
    }
}
//# sourceMappingURL=xstate-adapter.js.map