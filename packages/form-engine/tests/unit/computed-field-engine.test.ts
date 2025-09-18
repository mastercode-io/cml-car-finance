import { ComputedFieldEngine } from '@form-engine/computed/ComputedFieldEngine';
import type { ComputedField } from '@form-engine/types';

describe('ComputedFieldEngine', () => {
  let engine: ComputedFieldEngine;

  beforeEach(() => {
    engine = new ComputedFieldEngine();
  });

  it('should calculate simple arithmetic', () => {
    const field: ComputedField = {
      path: '$.total',
      expr: 'price * quantity',
      dependsOn: ['$.price', '$.quantity'],
    };

    engine.registerComputedField(field);

    const data = { price: 10, quantity: 5 };
    const result = engine.evaluate(field, data);

    expect(result.value).toBe(50);
    expect(data.total).toBe(50);
  });

  it('should handle complex expressions', () => {
    const field: ComputedField = {
      path: '$.age',
      expr: 'floor((now() - dateOfBirth) / 31536000000)',
      dependsOn: ['$.dateOfBirth'],
    };

    engine.registerComputedField(field);

    const data = {
      dateOfBirth: new Date('1990-01-01').getTime(),
    };
    const result = engine.evaluate(field, data);

    expect(typeof result.value).toBe('number');
    expect(result.value as number).toBeGreaterThan(30);
  });

  it('should detect circular dependencies', () => {
    const fields: ComputedField[] = [
      {
        path: '$.a',
        expr: 'b + 1',
        dependsOn: ['$.b'],
      },
      {
        path: '$.b',
        expr: 'a + 1',
        dependsOn: ['$.a'],
      },
    ];

    fields.forEach((field) => engine.registerComputedField(field));

    expect(() => engine.evaluateAll(fields, {})).toThrow('Circular dependency');
  });

  it('should use fallback on error', () => {
    const field: ComputedField = {
      path: '$.result',
      expr: 'undefinedVar + 1',
      dependsOn: [],
      fallback: 0,
    };

    engine.registerComputedField(field);

    const data = {};
    const result = engine.evaluate(field, data);

    expect(result.value).toBe(0);
    expect(result.error).toBeDefined();
  });
});
