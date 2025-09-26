/// <reference types="jest" />

import * as React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

import { FormRenderer } from '../FormRenderer';

const schema = {
  $id: 'review-required-test',
  version: '1.0.0',
  metadata: { title: 'T', description: 'D' },
  steps: [
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
  transitions: [],
  ui: {
    widgets: {
      confirmAccuracy: {
        component: 'Checkbox',
        label: 'I confirm the information provided is accurate',
      },
    },
  },
};

beforeAll(() => {
  if (typeof window !== 'undefined' && !('ResizeObserver' in window)) {
    class ResizeObserverMock {
      observe() {}
      unobserve() {}
      disconnect() {}
    }

    // @ts-expect-error - jsdom lacks ResizeObserver
    window.ResizeObserver = ResizeObserverMock;
  }
});

test('review submit maps required to confirmAccuracy and allows submit after checking', async () => {
  const onSubmit = jest.fn();

  render(<FormRenderer schema={schema as any} onSubmit={onSubmit} className="space-y-6" />);

  const submitBtn = screen.getByRole('button', { name: /submit/i });
  fireEvent.click(submitBtn);

  await waitFor(() => {
    expect(screen.getByText(/confirm/i)).toBeInTheDocument();
  });
  expect(onSubmit).not.toHaveBeenCalled();

  const cb = screen.getByRole('checkbox', { name: /confirm/i });
  fireEvent.click(cb);

  fireEvent.click(submitBtn);
  await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
});
