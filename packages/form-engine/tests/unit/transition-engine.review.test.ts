import { TransitionEngine } from '../../src/rules/transition-engine';
import type { UnifiedFormSchema } from '../../src/types';

describe('TransitionEngine review navigation policy', () => {
  const schema: UnifiedFormSchema = {
    $id: 'review-terminal',
    version: '1.0.0',
    metadata: { title: 'Review Terminal Flow', sensitivity: 'low' },
    steps: [
      { id: 'intro', title: 'Intro', schema: { type: 'object', properties: {} } },
      { id: 'review', title: 'Review', schema: { type: 'object', properties: {} } },
      { id: 'confirmation', title: 'Confirmation', schema: { type: 'object', properties: {} } },
    ],
    transitions: [
      { from: 'intro', to: 'review', default: true },
      { from: 'review', to: 'confirmation', default: true },
    ],
    ui: { widgets: {} },
  };

  it('treats the review step as terminal by default', () => {
    const engine = new TransitionEngine();
    const next = engine.getNextStep(schema, 'review', {});
    expect(next).toBeNull();
  });

  it('allows overriding the terminal behaviour via context', () => {
    const engine = new TransitionEngine();
    const next = engine.getNextStep(schema, 'review', {}, {
      navigationReviewPolicy: {
        stepId: 'review',
        terminal: false,
        freezeNavigation: false,
        validate: 'form',
      },
    });
    expect(next).toBe('confirmation');
  });
});
