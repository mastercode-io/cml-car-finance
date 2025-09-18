import {
  ComputedFieldEngine,
  DataSourceManager,
  RuleEvaluator,
  SchemaValidator,
  ValidationEngine
} from '@form-engine/index';

import type { JSONSchema, UnifiedFormSchema } from '@form-engine/index';

describe('SchemaValidator', () => {
  const validator = new SchemaValidator();

  const baseSchema: UnifiedFormSchema = {
    $id: 'test-form',
    version: '1.0.0',
    metadata: {
      title: 'Test Form',
      sensitivity: 'low'
    },
    steps: [
      {
        id: 'step-1',
        title: 'Step One',
        schema: {
          type: 'object',
          properties: {
            name: { type: 'string' }
          }
        }
      }
    ],
    transitions: [
      { from: 'step-1', to: 'step-1', default: true }
    ],
    ui: {
      widgets: {
        name: {
          component: 'Text',
          label: 'Name'
        }
      }
    }
  };

  it('accepts a valid unified schema', () => {
    const result = validator.validateSchema(baseSchema);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('flags invalid schemas', () => {
    const invalid: UnifiedFormSchema = {
      ...baseSchema,
      metadata: {
        ...baseSchema.metadata,
        // @ts-expect-error – intentionally breaking the schema
        sensitivity: 'critical'
      }
    };

    const result = validator.validateSchema(invalid);
    expect(result.valid).toBe(false);
    expect(result.errors[0]?.keyword).toBe('enum');
  });
});

describe('RuleEvaluator', () => {
  const evaluator = new RuleEvaluator();

  it('evaluates comparison rules', () => {
    const rule = { op: 'eq', left: '$.age', right: 21 } as const;
    expect(evaluator.evaluate(rule, { age: 21 })).toBe(true);
    expect(evaluator.evaluate(rule, { age: 18 })).toBe(false);
  });

  it('evaluates logical rules', () => {
    const rule = {
      op: 'and',
      args: [
        { op: 'eq', left: '$.country', right: 'UK' },
        { op: 'gt', left: '$.score', right: 700 }
      ]
    } as const;

    expect(evaluator.evaluate(rule, { country: 'UK', score: 720 })).toBe(true);
    expect(evaluator.evaluate(rule, { country: 'FR', score: 720 })).toBe(false);
  });
});

describe('ComputedFieldEngine', () => {
  it('computes expressions and rounds values', () => {
    const engine = new ComputedFieldEngine();
    const field = {
      path: 'totals.monthly',
      expr: 'income - expenses',
      dependsOn: ['income', 'expenses'],
      round: 2
    } as const;

    engine.registerComputedField(field);
    const result = engine.evaluate(field, { income: 1234.567, expenses: 234.56 });
    expect(result.value).toBeCloseTo(1000.01, 2);
    expect(engine.getAffectedFields('income')).toContain('totals.monthly');
  });
});

describe('DataSourceManager', () => {
  it('returns static data immediately', async () => {
    const manager = new DataSourceManager();
    const data = await manager.fetch({ type: 'static', data: [1, 2, 3], cache: 'none' });
    expect(data).toEqual([1, 2, 3]);
  });
});

describe('ValidationEngine', () => {
  it('validates simple JSON schemas', async () => {
    const engine = new ValidationEngine();
    const schema: JSONSchema = {
      $id: 'simple-schema',
      type: 'object',
      properties: {
        email: { type: 'string', format: 'email' }
      },
      required: ['email']
    };

    const success = await engine.validate(schema, { email: 'user@example.com' });
    expect(success.valid).toBe(true);

    const failure = await engine.validate(schema, { email: 'not-an-email' });
    expect(failure.valid).toBe(false);
    expect(failure.errors[0]?.message).toContain('Invalid');
  });
});
