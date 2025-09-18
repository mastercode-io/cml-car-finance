import { PathGenerator } from '../../../src/testing/PathGenerator';
import type { UnifiedFormSchema } from '../../../src/types';

describe('PathGenerator', () => {
  const schema: UnifiedFormSchema = {
    $id: 'test-schema',
    version: '1.0.0',
    metadata: {
      title: 'Test Flow',
      sensitivity: 'low',
    },
    steps: [
      {
        id: 'start',
        title: 'Start',
        schema: {
          type: 'object',
          properties: {
            accepted: { type: 'boolean' },
            age: { type: 'number', minimum: 18 },
          },
          required: ['accepted', 'age'],
        },
      },
      {
        id: 'details',
        title: 'Additional Details',
        schema: {
          type: 'object',
          properties: {
            email: { type: 'string', format: 'email' },
          },
          required: ['email'],
        },
      },
      {
        id: 'review',
        title: 'Review',
        schema: {
          type: 'object',
          properties: {},
        },
      },
    ],
    transitions: [
      {
        from: 'start',
        to: 'details',
        when: { op: 'eq', left: '$.accepted', right: true },
      },
      {
        from: 'start',
        to: 'review',
        default: true,
      },
      {
        from: 'details',
        to: 'review',
        default: true,
      },
    ],
    ui: { widgets: {} },
  };

  it('generates representative paths through the form', () => {
    const generator = new PathGenerator();
    const paths = generator.generatePaths(schema, { coverage: 'representative', maxPaths: 5 });

    expect(paths.length).toBeGreaterThanOrEqual(2);
    expect(paths.some((path) => path.steps.includes('details'))).toBe(true);
    expect(paths.some((path) => path.data.accepted === true)).toBe(true);
  });

  it('creates a minimal happy path when requested', () => {
    const generator = new PathGenerator();
    const paths = generator.generatePaths(schema, { coverage: 'minimal', includeInvalid: false });

    expect(paths).toHaveLength(1);
    expect(paths[0].expectedOutcome).toBe('success');
  });

  it('can skip invalid paths when includeInvalid is false', () => {
    const generator = new PathGenerator();
    const paths = generator.generatePaths(schema, {
      coverage: 'representative',
      includeInvalid: false,
      maxPaths: 10,
    });

    expect(paths.every((path) => path.expectedOutcome === 'success')).toBe(true);
  });
});
