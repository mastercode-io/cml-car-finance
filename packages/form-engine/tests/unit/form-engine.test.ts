import {
  ComputedFieldEngine,
  DataSourceManager,
  RuleEvaluator,
  SchemaValidator,
  ValidationEngine,
} from '@form-engine/index';

import type { JSONSchema, UnifiedFormSchema } from '@form-engine/index';

describe('SchemaValidator', () => {
  const validator = new SchemaValidator();

  const baseSchema: UnifiedFormSchema = {
    $id: 'test-form',
    version: '1.0.0',
    metadata: {
      title: 'Test Form',
      sensitivity: 'low',
    },
    steps: [
      {
        id: 'step-1',
        title: 'Step One',
        schema: {
          type: 'object',
          properties: {
            name: { type: 'string' },
          },
        },
      },
    ],
    transitions: [{ from: 'step-1', to: 'step-1', default: true }],
    ui: {
      widgets: {
        name: {
          component: 'Text',
          label: 'Name',
        },
      },
    },
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
        sensitivity: 'critical',
      },
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
        { op: 'gt', left: '$.score', right: 700 },
      ],
    } as const;

    expect(evaluator.evaluate(rule, { country: 'UK', score: 720 })).toBe(true);
    expect(evaluator.evaluate(rule, { country: 'FR', score: 720 })).toBe(false);
  });
});

describe('ComputedFieldEngine', () => {
  it('computes expressions and rounds values', () => {
    const engine = new ComputedFieldEngine();
    const field = {
      path: '$.totals.monthly',
      expr: 'income - expenses',
      dependsOn: ['$.income', '$.expenses'],
      round: 2,
    } as const;

    engine.registerComputedField(field);
    const data = { income: 1234.567, expenses: 234.56 };
    const result = engine.evaluate(field, data);
    expect(result.value).toBeCloseTo(1000.01, 2);
    expect(data.totals?.monthly).toBeCloseTo(1000.01, 2);
    expect(engine.getAffectedFields('$.income')).toContain('$.totals.monthly');
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
  let engine: ValidationEngine;

  beforeEach(() => {
    engine = new ValidationEngine();
  });

  afterEach(() => {
    jest.resetAllMocks();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (global as any).fetch;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (globalThis as any).fetch;
  });

  it('validates required fields with helpful errors', async () => {
    const schema: JSONSchema = {
      type: 'object',
      properties: {
        name: { type: 'string' },
        email: { type: 'string', format: 'email' },
      },
      required: ['name', 'email'],
    };

    const result = await engine.validate(schema, { name: 'John Doe' });

    expect(result.valid).toBe(false);
    expect(result.errors).toContainEqual(
      expect.objectContaining({
        property: 'email',
        message: 'email is required',
      }),
    );
  });

  it('validates custom formats', async () => {
    const schema: JSONSchema = {
      type: 'object',
      properties: {
        phone: { type: 'string', format: 'phone' },
      },
    };

    const success = await engine.validate(schema, { phone: '+14155551234' });
    const failure = await engine.validate(schema, { phone: '123' });

    expect(success.valid).toBe(true);
    expect(failure.valid).toBe(false);
  });

  it('handles async validation rules', async () => {
    const schema: JSONSchema = {
      type: 'object',
      properties: {
        username: {
          type: 'string',
          asyncValidate: {
            endpoint: '/api/validate/username',
            timeout: 1000,
          },
        },
      },
    };

    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ valid: true }),
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (global as any).fetch = fetchMock;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (globalThis as any).fetch = fetchMock;

    const result = await engine.validate(schema, { username: 'test-user' });

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/validate/username',
      expect.objectContaining({ method: 'POST' }),
    );
    expect(result.valid).toBe(true);
  });

  it('records validation duration for performance monitoring', async () => {
    const schema: JSONSchema = {
      $id: 'perf-schema',
      type: 'object',
      properties: {
        field1: { type: 'string' },
        field2: { type: 'number' },
        field3: { type: 'boolean' },
      },
    };

    const result = await engine.validate(schema, {
      field1: 'value',
      field2: 123,
      field3: true,
    });

    expect(result.duration).toBeLessThan(50);
    const metrics = engine.getPerformanceMetrics('perf-schema');
    expect(metrics.p95).toBeLessThan(50);
  });
});
