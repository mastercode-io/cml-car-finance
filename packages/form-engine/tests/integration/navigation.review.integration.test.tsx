import * as React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import type { UnifiedFormSchema } from '@form-engine/types';
import { FormRenderer } from '@form-engine/index';

class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}

if (typeof window !== 'undefined' && !('ResizeObserver' in window)) {
  (window as unknown as { ResizeObserver: typeof ResizeObserver }).ResizeObserver =
    ResizeObserverMock as unknown as typeof ResizeObserver;
}

describe('Review navigation policies', () => {
  const originalFlags = process.env.NEXT_PUBLIC_FLAGS;

  afterEach(() => {
    process.env.NEXT_PUBLIC_FLAGS = originalFlags;
  });

  const reviewStep: UnifiedFormSchema['steps'][number] = {
    id: 'review',
    title: 'Review',
    schema: { type: 'object', properties: {} },
  };

  const buildSchemaWithConfirmation = (): UnifiedFormSchema => ({
    $id: 'review-flow',
    version: '1.0.0',
    metadata: { title: 'Review Flow', sensitivity: 'low' },
    steps: [
      {
        id: 'details',
        title: 'Details',
        schema: {
          type: 'object',
          properties: {
            agree: { type: 'boolean' },
          },
        },
      },
      reviewStep,
      { id: 'confirmation', title: 'Confirmation', schema: { type: 'object', properties: {} } },
    ],
    transitions: [
      { from: 'details', to: 'review', default: true },
      { from: 'review', to: 'confirmation', default: true },
    ],
    ui: {
      widgets: { agree: { component: 'Checkbox', label: 'Agree to terms' } },
    },
  });

  const buildSchemaWithValidation = (): UnifiedFormSchema => ({
    $id: 'review-validation',
    version: '1.0.0',
    metadata: { title: 'Validation Flow', sensitivity: 'low' },
    validation: {
      strategy: 'onSubmit',
    },
    steps: [
      {
        id: 'personal',
        title: 'Personal',
        schema: {
          type: 'object',
          properties: {
            firstName: { type: 'string', minLength: 1 },
          },
          required: ['firstName'],
        },
      },
      reviewStep,
    ],
    transitions: [{ from: 'personal', to: 'review', default: true }],
    ui: {
      widgets: { firstName: { component: 'Text', label: 'First name' } },
    },
  });

  it('keeps the review step active when freeze flag is enabled', async () => {
    process.env.NEXT_PUBLIC_FLAGS = 'nav.reviewFreeze=true';
    const schema = buildSchemaWithConfirmation();
    const onSubmit = jest.fn();

    render(<FormRenderer schema={schema} onSubmit={onSubmit} />);

    fireEvent.click(await screen.findByRole('button', { name: /next/i }));

    await waitFor(() => expect(screen.getByRole('heading', { name: /review/i })).toBeInTheDocument());

    const reviewNext = await screen.findByRole('button', { name: /next/i });
    fireEvent.click(reviewNext);

    await waitFor(() => expect(screen.getByRole('heading', { name: /review/i })).toBeInTheDocument());
    expect(screen.queryByRole('heading', { name: /confirmation/i })).not.toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('bounces once to the first invalid step when submitting from review', async () => {
    process.env.NEXT_PUBLIC_FLAGS = 'nav.reviewFreeze=true';
    const schema = buildSchemaWithValidation();
    const onSubmit = jest.fn();

    render(<FormRenderer schema={schema} onSubmit={onSubmit} />);

    fireEvent.click(await screen.findByRole('button', { name: /next/i }));

    await waitFor(() => expect(screen.getByRole('heading', { name: /review/i })).toBeInTheDocument());

    const submitButton = await screen.findByRole('button', { name: /submit/i });
    fireEvent.click(submitButton);

    await waitFor(() => expect(screen.getByRole('heading', { name: /personal/i })).toBeInTheDocument());
    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getAllByRole('alert').length).toBeGreaterThan(0);
  });
});
