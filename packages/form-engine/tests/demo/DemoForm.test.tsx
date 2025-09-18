import type { ReactElement } from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

jest.mock('@form-engine/index', () => {
  const React = require('react') as typeof import('react');
  return {
    FormRenderer: jest.fn(({ onSubmit }: { onSubmit: (data: Record<string, unknown>) => void }) => {
      return (
        <form
          onSubmit={(event) => {
            event.preventDefault();
            onSubmit({});
          }}
        >
          <button type="submit">Submit</button>
        </form>
      ) as ReactElement;
    }),
    useFormAnalytics: jest.fn(() => ({
      trackStepView: jest.fn(),
      trackFieldInteraction: jest.fn(),
      trackValidation: jest.fn(),
      trackSubmission: jest.fn(),
      measureStepTransition: jest.fn(() => jest.fn()),
      startValidationMeasurement: jest.fn(() => jest.fn()),
      getSessionId: jest.fn(() => 'session-123'),
      getSessionMetrics: jest.fn(() => ({ startTime: Date.now() - 1000, endTime: Date.now() })),
    })),
    PersistenceManager: jest.fn().mockImplementation(() => ({
      loadDraft: jest.fn().mockResolvedValue(null),
      saveDraft: jest.fn().mockResolvedValue(undefined),
      flushPendingSaves: jest.fn().mockResolvedValue(undefined),
      deleteDraft: jest.fn().mockResolvedValue(undefined),
    })),
    PerformanceDashboard: jest.fn(() => <div data-testid="performance-dashboard" />),
  };
});

jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
  },
}));

import { DemoForm } from '../../../../src/demo/DemoForm';

describe('DemoForm', () => {
  it('renders the demo form header once ready', async () => {
    render(<DemoForm />);

    await waitFor(() => {
      expect(screen.getByText('Employment Application Demo')).toBeInTheDocument();
    });
  });

  it('toggles performance dashboard visibility label', async () => {
    render(<DemoForm />);

    const toggle = await screen.findByRole('button', { name: /show performance/i });
    fireEvent.click(toggle);

    expect(await screen.findByRole('button', { name: /hide performance/i })).toBeInTheDocument();
  });
});
