import {
  RuleBuilder,
  RuleEvaluator,
  TransitionEngine,
  VisibilityController,
  XStateAdapter,
} from '@form-engine/index';

import type { ComparisonRule, CustomRule, UnifiedFormSchema } from '@form-engine/index';

describe('RuleEvaluator (advanced)', () => {
  it('evaluates JSONPath comparisons', () => {
    const evaluator = new RuleEvaluator();
    const rule: ComparisonRule = RuleBuilder.equals('applicant.city', 'Boston');

    const data = {
      applicant: {
        city: 'Boston',
        state: 'MA',
      },
    };

    expect(evaluator.evaluate(rule, data)).toBe(true);
    expect(evaluator.evaluate(rule, { applicant: { city: 'Chicago' } })).toBe(false);
  });

  it('evaluates registered custom functions', () => {
    const evaluator = new RuleEvaluator();
    evaluator.registerCustomFunction('isAdult', (data) => data.age >= 18);

    const rule: CustomRule = { op: 'custom', fn: 'isAdult' };

    expect(evaluator.evaluate(rule, { age: 20 })).toBe(true);
    expect(evaluator.evaluate(rule, { age: 16 })).toBe(false);
  });
});

describe('VisibilityController', () => {
  const schema: UnifiedFormSchema = {
    $id: 'visibility-test',
    version: '1.0.0',
    metadata: {
      title: 'Visibility Test',
      sensitivity: 'low',
    },
    steps: [
      {
        id: 'financials',
        title: 'Financial Information',
        schema: {
          type: 'object',
          properties: {
            income: { type: 'number' },
            bonus: {
              type: 'number',
              'x-visibility': RuleBuilder.greaterThan('income', 0),
            },
          },
        },
      },
    ],
    transitions: [],
    ui: { widgets: {} },
  };

  it('returns only visible fields based on rules', () => {
    const controller = new VisibilityController();

    const visibleWhenIncomePresent = controller.getVisibleFields(schema, 'financials', {
      income: 5000,
    });
    expect(visibleWhenIncomePresent).toEqual(['income', 'bonus']);

    const visibleWhenMissingIncome = controller.getVisibleFields(schema, 'financials', {});
    expect(visibleWhenMissingIncome).toEqual(['income']);
  });
});

describe('TransitionEngine', () => {
  const schema: UnifiedFormSchema = {
    $id: 'transition-test',
    version: '1.0.0',
    metadata: {
      title: 'Transition Test',
      sensitivity: 'low',
    },
    steps: [
      { id: 'step1', title: 'Step 1', schema: { type: 'object', properties: {} } },
      { id: 'step2', title: 'Step 2', schema: { type: 'object', properties: {} } },
      { id: 'step3', title: 'Step 3', schema: { type: 'object', properties: {} } },
    ],
    transitions: [
      {
        from: 'step1',
        to: 'step3',
        when: RuleBuilder.equals('skip', true),
      },
      {
        from: 'step1',
        to: 'step2',
        when: RuleBuilder.equals('skip', false),
      },
      {
        from: 'step1',
        to: 'step2',
        default: true,
      },
    ],
    ui: { widgets: {} },
  };

  it('prefers conditional transitions when conditions match', () => {
    const engine = new TransitionEngine();
    const next = engine.getNextStep(schema, 'step1', { skip: true });
    expect(next).toBe('step3');
  });

  it('falls back to default transitions', () => {
    const engine = new TransitionEngine();
    const next = engine.getNextStep(schema, 'step1', { skip: 'maybe' });
    expect(next).toBe('step2');
  });

  it('returns null when the current step has no outgoing transitions', () => {
    const engine = new TransitionEngine();
    const next = engine.getNextStep(schema, 'step3', {});
    expect(next).toBeNull();
  });

  it('evaluates transitions in declared order before considering default fallback', () => {
    const engine = new TransitionEngine();
    const orderedSchema: UnifiedFormSchema = {
      ...schema,
      transitions: [
        { from: 'step1', to: 'step2', default: true },
        { from: 'step1', to: 'step3', when: RuleBuilder.equals('skip', true) },
      ],
    };

    expect(engine.getNextStep(orderedSchema, 'step1', { skip: true })).toBe('step3');
    expect(engine.getNextStep(orderedSchema, 'step1', { skip: false })).toBe('step2');
  });

  it('resolves the first matching transition when multiple conditions pass', () => {
    const engine = new TransitionEngine();
    const deterministicSchema: UnifiedFormSchema = {
      ...schema,
      steps: [
        ...schema.steps,
        { id: 'step4', title: 'Step 4', schema: { type: 'object', properties: {} } },
      ],
      transitions: [
        { from: 'step1', to: 'step2', when: RuleBuilder.greaterThan('score', 5) },
        { from: 'step1', to: 'step3', when: RuleBuilder.greaterThan('score', 1) },
        { from: 'step1', to: 'step4', default: true },
      ],
    };

    expect(engine.getNextStep(deterministicSchema, 'step1', { score: 10 })).toBe('step2');
    expect(engine.getNextStep(deterministicSchema, 'step1', { score: 2 })).toBe('step3');
    expect(engine.getNextStep(deterministicSchema, 'step1', { score: 0 })).toBe('step4');
  });

  it('throws when multiple default transitions are defined for a step', () => {
    const engine = new TransitionEngine();
    const invalidSchema: UnifiedFormSchema = {
      ...schema,
      transitions: [
        { from: 'step1', to: 'step2', default: true },
        { from: 'step1', to: 'step3', default: true },
      ],
    };

    expect(() => engine.getNextStep(invalidSchema, 'step1', {})).toThrow(
      'Step "step1" has multiple default transitions defined.',
    );
  });

  it('evaluates guard-based transitions before the default fallback', () => {
    const engine = new TransitionEngine();
    const guardedSchema: UnifiedFormSchema = {
      ...schema,
      steps: [
        ...schema.steps,
        { id: 'step4', title: 'Step 4', schema: { type: 'object', properties: {} } },
      ],
      transitions: [
        { from: 'step1', to: 'step2', guard: 'allowAdvance' },
        { from: 'step1', to: 'step3', guard: 'allowFallback' },
        { from: 'step1', to: 'step4', default: true },
      ],
    };

    const context = {
      guards: {
        allowAdvance: () => true,
        allowFallback: () => true,
      },
    };

    expect(engine.getNextStep(guardedSchema, 'step1', {}, context)).toBe('step2');
  });

  it('falls back to the default transition when guards decline', () => {
    const engine = new TransitionEngine();
    const guardedSchema: UnifiedFormSchema = {
      ...schema,
      steps: [
        ...schema.steps,
        { id: 'step4', title: 'Step 4', schema: { type: 'object', properties: {} } },
      ],
      transitions: [
        { from: 'step1', to: 'step2', guard: 'allowAdvance' },
        { from: 'step1', to: 'step3', guard: 'allowFallback' },
        { from: 'step1', to: 'step4', default: true },
      ],
    };

    const context = {
      guards: {
        allowAdvance: () => false,
        allowFallback: () => false,
      },
    };

    expect(engine.getNextStep(guardedSchema, 'step1', {}, context)).toBe('step4');
  });

  it('returns null when guard transitions decline and no default is defined', () => {
    const engine = new TransitionEngine();
    const terminalSchema: UnifiedFormSchema = {
      ...schema,
      transitions: [{ from: 'step1', to: 'step2', guard: 'allowAdvance' }],
    };

    const context = {
      guards: {
        allowAdvance: () => false,
      },
    };

    expect(engine.getNextStep(terminalSchema, 'step1', {}, context)).toBeNull();
  });
});

describe('XStateAdapter', () => {
  const schema: UnifiedFormSchema = {
    $id: 'xstate-test',
    version: '1.0.0',
    metadata: {
      title: 'XState Form',
      sensitivity: 'low',
      requiresAudit: true,
    },
    steps: [
      { id: 'step1', title: 'Step 1', schema: { type: 'object', properties: {} } },
      { id: 'step2', title: 'Step 2', schema: { type: 'object', properties: {} } },
    ],
    transitions: [
      {
        from: 'step1',
        to: 'step2',
        when: RuleBuilder.equals('ready', true),
      },
      {
        from: 'step1',
        to: 'step2',
        default: true,
      },
    ],
    ui: { widgets: {} },
  };

  it('recommends XState when audit trail required', () => {
    const adapter = new XStateAdapter();
    expect(adapter.shouldUseXState(schema)).toBe(true);
  });

  it('creates a machine with step states', () => {
    const adapter = new XStateAdapter();
    const machine = adapter.convertToStateMachine(schema);

    expect(machine.config.initial).toBe('step1');
    expect(Object.keys(machine.config.states ?? {})).toEqual(
      expect.arrayContaining(['step1', 'step2', 'complete']),
    );
  });
});
