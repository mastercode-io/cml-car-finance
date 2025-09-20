import { createActor } from 'xstate';

import { XStateAdapter, type UnifiedFormSchema } from '@form-engine/index';

describe('XStateAdapter integration', () => {
  const schema: UnifiedFormSchema = {
    $id: 'integration-flow',
    version: '1.0.0',
    metadata: {
      title: 'XState Integration Test Form',
      sensitivity: 'low',
      requiresAudit: false,
    },
    steps: [
      {
        id: 'step1',
        title: 'Eligibility',
        schema: {
          type: 'object',
          properties: {
            ready: { type: 'boolean' },
          },
        },
      },
      {
        id: 'step2',
        title: 'Confirmation',
        schema: {
          type: 'object',
          properties: {
            confirmation: { type: 'string' },
          },
        },
      },
    ],
    transitions: [],
    ui: { widgets: {} },
  };

  it('creates an actor that exposes the form flow states and events', async () => {
    const adapter = new XStateAdapter();
    const machine = adapter.convertToStateMachine(schema);
    const actor = createActor(machine);
    actor.start();

    let snapshot = actor.getSnapshot();
    expect(snapshot.value).toBe('step1');
    expect(snapshot.context.currentStep).toBe('step1');
    expect(snapshot.context.submissionState.submitted).toBe(false);
    expect(snapshot.can({ type: 'NEXT' })).toBe(true);
    expect(snapshot.can({ type: 'PREVIOUS' })).toBe(false);

    actor.send({ type: 'UPDATE_FIELD', field: 'ready', value: true });
    await new Promise((resolve) => setTimeout(resolve, 0));
    snapshot = actor.getSnapshot();
    expect(snapshot.context).toHaveProperty('formData');

    actor.stop();
  });
});
