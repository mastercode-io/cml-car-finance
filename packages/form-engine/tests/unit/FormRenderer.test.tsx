import * as React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import type { UnifiedFormSchema } from '@form-engine/types';
import { FormRenderer } from '@form-engine/index';

const buildSchema = (): UnifiedFormSchema => ({
  $id: 'test-form',
  version: '1.0.0',
  metadata: {
    title: 'Test Form',
    description: 'Test form description',
    sensitivity: 'low',
  },
  steps: [
    {
      id: 'personal',
      title: 'Personal Info',
      schema: {
        type: 'object',
        properties: {
          firstName: { type: 'string', minLength: 1 },
          lastName: { type: 'string', minLength: 1 },
        },
        required: ['firstName', 'lastName'],
      },
    },
    {
      id: 'contact',
      title: 'Contact Info',
      schema: {
        type: 'object',
        properties: {
          email: { type: 'string', format: 'email' },
          phone: { type: 'string' },
        },
        required: ['email'],
      },
    },
  ],
  transitions: [{ from: 'personal', to: 'contact', default: true }],
  ui: {
    widgets: {
      firstName: { component: 'Text', label: 'First Name' },
      lastName: { component: 'Text', label: 'Last Name' },
      email: { component: 'Email', label: 'Email' },
      phone: { component: 'Phone', label: 'Phone' },
    },
  },
});

describe('FormRenderer', () => {
  it('renders the first step fields by default', async () => {
    const schema = buildSchema();

    render(<FormRenderer schema={schema} onSubmit={jest.fn()} />);

    expect(await screen.findByRole('textbox', { name: /first name/i })).toBeInTheDocument();
    expect(await screen.findByRole('textbox', { name: /last name/i })).toBeInTheDocument();
  });

  it('displays validation errors when moving forward without completing required fields', async () => {
    const schema = buildSchema();

    render(<FormRenderer schema={schema} onSubmit={jest.fn()} />);

    fireEvent.click(await screen.findByRole('button', { name: /next/i }));

    await waitFor(() => {
      const alerts = screen.getAllByRole('alert');
      expect(alerts.length).toBeGreaterThan(0);
    });
  });

  it('navigates to the next step when the current step is valid', async () => {
    const schema = buildSchema();

    render(<FormRenderer schema={schema} onSubmit={jest.fn()} />);

    fireEvent.change(await screen.findByRole('textbox', { name: /first name/i }), {
      target: { value: 'John' },
    });
    fireEvent.change(await screen.findByRole('textbox', { name: /last name/i }), {
      target: { value: 'Doe' },
    });

    fireEvent.click(await screen.findByRole('button', { name: /next/i }));

    await waitFor(() => {
      expect(screen.getByRole('textbox', { name: /email/i })).toBeInTheDocument();
    });
  });

  it('submits the form data with metadata when all steps are valid', async () => {
    const schema = buildSchema();
    const onSubmit = jest.fn();

    render(<FormRenderer schema={schema} onSubmit={onSubmit} />);

    fireEvent.change(await screen.findByRole('textbox', { name: /first name/i }), {
      target: { value: 'Jane' },
    });
    fireEvent.change(await screen.findByRole('textbox', { name: /last name/i }), {
      target: { value: 'Doe' },
    });

    fireEvent.click(await screen.findByRole('button', { name: /next/i }));

    await waitFor(() => {
      fireEvent.change(screen.getByRole('textbox', { name: /email/i }), {
        target: { value: 'jane@example.com' },
      });
    });

    fireEvent.click(screen.getByRole('button', { name: /submit/i }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledTimes(1);
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          firstName: 'Jane',
          lastName: 'Doe',
          email: 'jane@example.com',
          _meta: expect.objectContaining({
            schemaId: 'test-form',
            schemaVersion: '1.0.0',
          }),
        }),
      );
    });
  });

  it('respects step visibility rules', async () => {
    const baseSchema = buildSchema();
    const conditionalSchema: UnifiedFormSchema = {
      ...baseSchema,
      steps: [
        ...baseSchema.steps,
        {
          id: 'conditional',
          title: 'Conditional Step',
          schema: { type: 'object', properties: {} },
          visibleWhen: {
            op: 'eq',
            left: '$.showConditional',
            right: true,
          },
        },
      ],
    };

    const { rerender } = render(
      <FormRenderer
        schema={conditionalSchema}
        initialData={{ showConditional: false }}
        onSubmit={jest.fn()}
      />,
    );

    expect(screen.queryByText('Conditional Step')).not.toBeInTheDocument();

    rerender(
      <FormRenderer
        schema={conditionalSchema}
        initialData={{ showConditional: true }}
        onSubmit={jest.fn()}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText('Conditional Step')).toBeInTheDocument();
    });
  });
});
