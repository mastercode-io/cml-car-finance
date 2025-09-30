import * as React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import type { UnifiedFormSchema } from '@form-engine/types';
import { FormRenderer } from '@form-engine/index';

describe('FormRenderer grid layout integration', () => {
  const buildSchema = (enableFlag: boolean): UnifiedFormSchema => ({
    $id: 'grid-step',
    version: '1.0.0',
    metadata: { title: 'Grid Step', sensitivity: 'low' },
    steps: [
      {
        id: 'details',
        title: 'Contact details',
        schema: {
          type: 'object',
          properties: {
            firstName: { type: 'string' },
            lastName: { type: 'string' },
            email: { type: 'string', format: 'email' },
          },
          required: ['firstName', 'email'],
        },
      },
    ],
    transitions: [],
    ui: {
      layout: {
        type: 'grid',
        columns: { base: 4, md: 6 },
        gutter: { base: 12, md: 24 },
        rowGap: { base: 16 },
        sections: [
          {
            id: 'primary',
            rows: [
              {
                fields: [
                  { name: 'firstName', colSpan: { base: 4, md: 3 } },
                  { name: 'lastName', colSpan: { base: 4, md: 3 } },
                ],
              },
              {
                fields: [{ name: 'email', colSpan: { base: 4, md: 6 } }],
              },
            ],
          },
        ],
      },
      widgets: {
        firstName: { component: 'Text', label: 'First name' },
        lastName: { component: 'Text', label: 'Last name' },
        email: { component: 'Text', label: 'Email address' },
      },
    },
    features: enableFlag ? { gridLayout: true } : undefined,
  });

  it('applies responsive grid styles when the grid flag is enabled', () => {
    const schema = buildSchema(true);

    render(
      <FormRenderer
        schema={schema}
        onSubmit={jest.fn()}
        gridBreakpointOverride="md"
      />,
    );

    const gridContainer = document.querySelector('[data-grid-breakpoint="md"]');
    expect(gridContainer).not.toBeNull();

    const rows = gridContainer?.querySelectorAll('[data-grid-row]') ?? [];
    expect(rows).toHaveLength(2);

    const firstRow = rows.item(0) as HTMLElement;
    expect(firstRow.style.getPropertyValue('--cols')).toBe('6');
    expect(firstRow.style.getPropertyValue('--gutter')).toBe('24px');
    expect(firstRow.style.getPropertyValue('--rowgap')).toBe('16px');

    const firstRowFields = firstRow.querySelectorAll('[data-grid-field]');
    expect(firstRowFields).toHaveLength(2);
    expect((firstRowFields.item(0) as HTMLElement).style.gridColumn).toBe('span 3 / span 3');
    expect((firstRowFields.item(1) as HTMLElement).style.gridColumn).toBe('span 3 / span 3');

    const secondRow = rows.item(1) as HTMLElement;
    const emailField = secondRow.querySelector('[data-grid-field="email"]') as HTMLElement;
    expect(emailField.style.gridColumn).toBe('span 6 / span 6');
  });

  it('falls back to single-column rendering when the grid flag is disabled', () => {
    const schema = buildSchema(false);

    render(<FormRenderer schema={schema} onSubmit={jest.fn()} />);

    expect(document.querySelector('[data-grid-breakpoint]')).toBeNull();
    expect(document.querySelectorAll('[data-grid-field]').length).toBe(0);

    const fieldWrappers = document.querySelectorAll('[data-field-wrapper]');
    expect(fieldWrappers).toHaveLength(3);

    expect(screen.getByLabelText(/first name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/last name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
  });

  it('keeps field order stable when validation errors are displayed', async () => {
    const schema = buildSchema(true);

    render(
      <FormRenderer
        schema={schema}
        onSubmit={jest.fn()}
        gridBreakpointOverride="base"
      />,
    );

    const initialOrder = Array.from(
      document.querySelectorAll('[data-grid-field]'),
    ).map((node) => node.getAttribute('data-grid-field'));

    fireEvent.click(screen.getByRole('button', { name: /submit/i }));

    await waitFor(() => {
      expect(screen.getAllByRole('alert').length).toBeGreaterThan(0);
    });

    const postOrder = Array.from(
      document.querySelectorAll('[data-grid-field]'),
    ).map((node) => node.getAttribute('data-grid-field'));

    expect(postOrder).toEqual(initialOrder);

    const errorSlots = document.querySelectorAll('[data-field-error-slot]');
    expect(errorSlots.length).toBeGreaterThan(0);

    errorSlots.forEach((slot) => {
      const element = slot as HTMLElement;
      expect(element.style.minHeight).toBe('var(--grid-field-error-slot, 0px)');
    });
  });
});
