import * as React from 'react';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';

import type { UnifiedFormSchema } from '@form-engine/types';
import { FormRenderer } from '@form-engine/index';

describe('FormRenderer review submission requirements', () => {
  const schema: UnifiedFormSchema = {
    $id: 'review-confirmation',
    version: '1.0.0',
    metadata: { title: 'Review Confirmation', sensitivity: 'low' },
    steps: [
      {
        id: 'details',
        title: 'Details',
        schema: {
          type: 'object',
          properties: {
            fullName: { type: 'string' },
          },
        },
      },
      {
        id: 'review',
        title: 'Review & Submit',
        schema: {
          type: 'object',
          properties: {
            confirmAccuracy: { type: 'boolean', const: true },
          },
          required: ['confirmAccuracy'],
        },
      },
    ],
    transitions: [
      { from: 'details', to: 'review', default: true },
    ],
    ui: {
      widgets: {
        fullName: { component: 'Text', label: 'Full name' },
        confirmAccuracy: {
          component: 'Checkbox',
          label: 'I confirm the information provided is accurate',
        },
      },
    },
  };

  it('renders review fields and blocks submission until confirmation is checked', async () => {
    const onSubmit = jest.fn();

    render(<FormRenderer schema={schema} onSubmit={onSubmit} />);

    const nextButton = await screen.findByRole('button', { name: /next/i });
    fireEvent.click(nextButton);

    await waitFor(() =>
      expect(
        screen.getByRole('heading', { name: /review & submit/i }),
      ).toBeInTheDocument(),
    );

    const confirmation = await screen.findByRole('checkbox', {
      name: /information provided is accurate/i,
    });
    expect(confirmation).toBeInTheDocument();

    const submitButton = screen.getByRole('button', { name: /submit/i });
    fireEvent.click(submitButton);

    await waitFor(() => expect(onSubmit).not.toHaveBeenCalled());

    const alerts = await screen.findAllByRole('alert');
    const banner = alerts.find((element) =>
      element.textContent?.includes(
        'Please review the highlighted fields: One or more fields require your attention.',
      ),
    );
    expect(banner).toBeTruthy();

    const fieldWrapper = confirmation.closest('[data-field-wrapper]');
    expect(fieldWrapper).not.toBeNull();
    const errorMessage = await within(fieldWrapper as HTMLElement).findByRole('alert');
    expect(errorMessage).toHaveTextContent(/must be equal to constant/i);

    fireEvent.click(confirmation);
    fireEvent.click(submitButton);

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(onSubmit.mock.calls[0]?.[0]).toMatchObject({ confirmAccuracy: true });
    await waitFor(() =>
      expect(within(fieldWrapper as HTMLElement).queryByRole('alert')).toBeNull(),
    );
    await waitFor(() =>
      expect(
        screen.queryByText(
          'Please review the highlighted fields: One or more fields require your attention.',
        ),
      ).toBeNull(),
    );
  });
});

