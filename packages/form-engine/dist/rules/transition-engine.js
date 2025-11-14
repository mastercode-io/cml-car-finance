import { RuleEvaluator } from './rule-evaluator';
import { VisibilityController } from './visibility-controller';
export class TransitionEngine {
    evaluator;
    history = [];
    visibility;
    constructor(evaluator = new RuleEvaluator()) {
        this.evaluator = evaluator;
        this.visibility = new VisibilityController(this.evaluator);
    }
    getNextStep(schema, currentStep, data, context) {
        const reviewPolicy = context?.navigationReviewPolicy ?? {
            stepId: schema.navigation?.review?.stepId ?? 'review',
            terminal: schema.navigation?.review?.terminal ?? true,
            freezeNavigation: schema.navigation?.review?.freezeNavigation ?? true,
            validate: schema.navigation?.review?.validate ?? 'form',
        };
        if (currentStep === reviewPolicy.stepId && reviewPolicy.terminal) {
            return null;
        }
        const transitions = schema.transitions.filter((transition) => transition.from === currentStep);
        const defaultCount = transitions.filter((transition) => transition.default).length;
        if (defaultCount > 1) {
            throw new Error(`Step "${currentStep}" has multiple default transitions defined.`);
        }
        const defaultTransition = transitions.find((transition) => transition.default);
        for (const transition of transitions) {
            if (transition.default) {
                continue;
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
        if (defaultTransition) {
            this.recordTransition(currentStep, defaultTransition.to, 'default');
            return defaultTransition.to;
        }
        return null;
    }
    getPreviousStep(schema, currentStep, data, context) {
        const visibleSteps = this.getAllVisibleSteps(schema, data, context);
        const currentIndex = visibleSteps.indexOf(currentStep);
        if (currentIndex > 0) {
            return visibleSteps[currentIndex - 1];
        }
        return null;
    }
    canTransition(schema, from, to, data, context) {
        const next = this.getNextStep(schema, from, data, context);
        return next === to;
    }
    getTransitionPath(schema, startStep, endStep, data, maxSteps = 20, context) {
        const path = [startStep];
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
    getTransitionHistory() {
        return [...this.history];
    }
    clearHistory() {
        this.history = [];
    }
    recordTransition(from, to, type) {
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
    getAllVisibleSteps(schema, data, context) {
        return this.visibility.getVisibleSteps(schema, data, context);
    }
}
//# sourceMappingURL=transition-engine.js.map