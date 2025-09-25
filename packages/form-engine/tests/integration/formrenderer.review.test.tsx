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

describe('FormRenderer review step', () => {
  const originalFlags = process.env.NEXT_PUBLIC_FLAGS;

  afterEach(() => {
    process.env.NEXT_PUBLIC_FLAGS = originalFlags;
  });

  const reviewStep: UnifiedFormSchema['steps'][number] = {
    id: 'review',
    title: 'Review',
    description: 'Check your answers before submitting.',
    schema: { type: 'object', properties: {} },
  };

  const buildBasicSchema = (): UnifiedFormSchema => ({
    $id: 'review-basic',
    version: '1.0.0',
    metadata: { title: 'Basic Review Flow', sensitivity: 'low' },
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
    ],
    transitions: [{ from: 'details', to: 'review', default: true }],
    ui: {
      widgets: {
        agree: { component: 'Checkbox', label: 'Agree to terms' },
      },
    },
  });

  const buildSchemaWithValidation = (): UnifiedFormSchema => ({
    $id: 'review-validation',
    version: '1.0.0',
    metadata: { title: 'Validation Review Flow', sensitivity: 'low' },
    validation: { strategy: 'onSubmit' },
    steps: [
      {
        id: 'personal',
        title: 'Personal information',
        description: 'Tell us about yourself.',
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
      widgets: {
        firstName: { component: 'Text', label: 'First name' },
      },
    },
  });

  it('navigates to review and freezes navigation when policy enabled', async () => {
    process.env.NEXT_PUBLIC_FLAGS = 'nav.reviewFreeze=true';
    const schema = buildBasicSchema();

    render(<FormRenderer schema={schema} onSubmit={jest.fn()} />);

    const nextButton = await screen.findByRole('button', { name: /next/i });
    fireEvent.click(nextButton);

    await waitFor(() => expect(screen.getByRole('heading', { name: /review/i })).toBeInTheDocument());

    expect(screen.queryByRole('button', { name: /next/i })).not.toBeInTheDocument();
    const previousButton = screen.getByRole('button', { name: /previous/i });
    expect(previousButton).toBeDisabled();
    expect(screen.getByRole('button', { name: /submit/i })).toBeInTheDocument();
  });

  it('keeps focus on review and highlights the first invalid section when submitting invalid data', async () => {
    process.env.NEXT_PUBLIC_FLAGS = 'nav.reviewFreeze=true';
    const schema = buildSchemaWithValidation();
    const onSubmit = jest.fn();

    render(<FormRenderer schema={schema} onSubmit={onSubmit} />);

    const nextButton = await screen.findByRole('button', { name: /next/i });
    fireEvent.click(nextButton);

    await waitFor(() => expect(screen.getByRole('heading', { name: /review/i })).toBeInTheDocument());

    const submitButton = await screen.findByRole('button', { name: /submit/i });
    fireEvent.click(submitButton);

    await waitFor(() => expect(screen.getByRole('heading', { name: /review/i })).toBeInTheDocument());
    const personalSection = await screen.findByTestId('review-section-personal');
    await waitFor(() => expect(personalSection).toHaveAttribute('data-highlighted', 'true'));
    expect(personalSection).toHaveAttribute('data-has-errors', 'true');
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('submits valid data with summary payload including metadata', async () => {
    process.env.NEXT_PUBLIC_FLAGS = 'nav.reviewFreeze=true';
    const schema = buildSchemaWithValidation();
    const onSubmit = jest.fn();

    render(<FormRenderer schema={schema} onSubmit={onSubmit} />);

    const firstNameInput = await screen.findByLabelText(/first name/i);
    fireEvent.change(firstNameInput, { target: { value: 'Ada' } });

    const nextButton = await screen.findByRole('button', { name: /next/i });
    fireEvent.click(nextButton);

    await waitFor(() => expect(screen.getByRole('heading', { name: /review/i })).toBeInTheDocument());
    expect(screen.getByText('Ada')).toBeInTheDocument();

    const submitButton = screen.getByRole('button', { name: /submit/i });
    fireEvent.click(submitButton);

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    const payload = onSubmit.mock.calls[0]?.[0];
    expect(payload).toMatchObject({
      firstName: 'Ada',
      _meta: {
        schemaId: schema.$id,
        schemaVersion: schema.version,
      },
    });
  });
});
