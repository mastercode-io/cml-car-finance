import { SchemaComposer } from '../../src/core/schema-composer';
import type { UnifiedFormSchema } from '../../src/types';

describe('SchemaComposer override guard', () => {
  const baseSchema: UnifiedFormSchema = {
    $id: 'base',
    version: '1.0.0',
    metadata: {
      title: 'Base form',
      sensitivity: 'low',
    },
    steps: [
      {
        id: 'step-1',
        title: 'Step one',
        schema: {
          type: 'object',
          properties: {},
        },
      },
    ],
    transitions: [
      {
        from: 'start',
        to: 'step-1',
        default: true,
      },
    ],
    ui: {
      widgets: {},
    },
  };

  it('throws when overriding metadata without explicit override directive', () => {
    const composer = new SchemaComposer([baseSchema]);
    const overrideSchema: UnifiedFormSchema = {
      ...baseSchema,
      $id: 'child',
      extends: ['base'],
      metadata: {
        ...baseSchema.metadata,
        title: 'Updated form title',
      },
    };

    expect(() => composer.compose(overrideSchema)).toThrowError(/#\/metadata\/title/);
  });

  it('allows metadata override when directive is provided and strips the metadata fields', () => {
    const composer = new SchemaComposer([baseSchema]);
    const overrideSchema: UnifiedFormSchema = {
      ...baseSchema,
      $id: 'child',
      extends: ['base'],
      metadata: {
        ...baseSchema.metadata,
        override: true,
        reason: 'Align copy with marketing',
        title: 'Updated form title',
      } as any,
    };

    const composed = composer.compose(overrideSchema);

    expect(composed.metadata.title).toBe('Updated form title');
    expect((composed.metadata as any).override).toBeUndefined();
    expect((composed.metadata as any).reason).toBeUndefined();
  });

  it('enforces override directive for step collisions', () => {
    const composer = new SchemaComposer([baseSchema]);
    const overrideSchema: UnifiedFormSchema = {
      ...baseSchema,
      $id: 'child',
      extends: ['base'],
      steps: [
        {
          ...baseSchema.steps[0],
          title: 'Adjusted title',
        },
      ],
    };

    expect(() => composer.compose(overrideSchema)).toThrowError(/#\/steps\/step-1/);
  });

  it('merges step overrides when directive is declared', () => {
    const composer = new SchemaComposer([baseSchema]);
    const overrideSchema: UnifiedFormSchema = {
      ...baseSchema,
      $id: 'child',
      extends: ['base'],
      steps: [
        {
          ...baseSchema.steps[0],
          override: true,
          reason: 'Refine heading copy',
          title: 'Adjusted title',
        } as any,
      ],
    };

    const composed = composer.compose(overrideSchema);

    expect(composed.steps[0].title).toBe('Adjusted title');
    expect((composed.steps[0] as any).override).toBeUndefined();
    expect((composed.steps[0] as any).reason).toBeUndefined();
  });

  it('enforces transition overrides', () => {
    const composer = new SchemaComposer([baseSchema]);
    const overrideSchema: UnifiedFormSchema = {
      ...baseSchema,
      $id: 'child',
      extends: ['base'],
      transitions: [
        {
          ...baseSchema.transitions[0],
          default: false,
        },
      ],
    };

    expect(() => composer.compose(overrideSchema)).toThrowError(/#\/transitions\/start->step-1/);
  });

  it('permits transition overrides with directive', () => {
    const composer = new SchemaComposer([baseSchema]);
    const overrideSchema: UnifiedFormSchema = {
      ...baseSchema,
      $id: 'child',
      extends: ['base'],
      transitions: [
        {
          ...baseSchema.transitions[0],
          override: true,
          reason: 'Hand off to different path',
          default: false,
        } as any,
      ],
    };

    const composed = composer.compose(overrideSchema);

    expect(composed.transitions[0].default).toBe(false);
    expect((composed.transitions[0] as any).override).toBeUndefined();
    expect((composed.transitions[0] as any).reason).toBeUndefined();
  });
});
