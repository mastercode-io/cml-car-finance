import * as React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';

import type { UnifiedFormSchema } from '@form-engine/types';
import { FormRenderer } from '@form-engine/index';

const saveDraftMock = jest.fn();
const flushPendingSavesMock = jest.fn();
const loadDraftMock = jest.fn();
const deleteDraftMock = jest.fn();

jest.mock('../../src/persistence/PersistenceManager', () => ({
  PersistenceManager: jest.fn().mockImplementation(() => ({
    saveDraft: saveDraftMock,
    flushPendingSaves: flushPendingSavesMock,
    loadDraft: loadDraftMock,
    deleteDraft: deleteDraftMock,
  })),
}));

const { PersistenceManager } = jest.requireMock('../../src/persistence/PersistenceManager') as {
  PersistenceManager: jest.Mock;
};

beforeEach(() => {
  saveDraftMock.mockReset();
  flushPendingSavesMock.mockReset();
  loadDraftMock.mockReset();
  deleteDraftMock.mockReset();
  PersistenceManager.mockClear();
});

afterEach(() => {
  jest.useRealTimers();
});

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
  const originalFlags = process.env.NEXT_PUBLIC_FLAGS;

  afterEach(() => {
    process.env.NEXT_PUBLIC_FLAGS = originalFlags;
  });

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

  it('handles repeater fields and submits array data', async () => {
    const schema: UnifiedFormSchema = {
      $id: 'repeater-form',
      version: '1.0.0',
      metadata: {
        title: 'Repeater Form',
        description: 'Test form with repeater field',
        sensitivity: 'low',
      },
      steps: [
        {
          id: 'household',
          title: 'Household',
          schema: {
            type: 'object',
            properties: {
              references: {
                type: 'array',
                minItems: 1,
                maxItems: 3,
                items: {
                  type: 'object',
                  properties: {
                    fullName: { type: 'string', minLength: 1 },
                    email: { type: 'string', format: 'email' },
                  },
                  required: ['fullName', 'email'],
                },
              },
            },
            required: ['references'],
          },
        },
      ],
      transitions: [],
      ui: {
        widgets: {
          references: {
            component: 'Repeater',
            label: 'References',
            itemLabel: 'Reference',
            minItems: 1,
            maxItems: 3,
            addButtonLabel: 'Add reference',
            removeButtonLabel: 'Remove reference',
            fields: [
              { name: 'fullName', component: 'Text', label: 'Full name', required: true },
              { name: 'email', component: 'Email', label: 'Email address', required: true },
            ],
          },
        },
      },
    };

    const onSubmit = jest.fn();
    render(<FormRenderer schema={schema} onSubmit={onSubmit} />);

    expect(await screen.findByText(/reference 1/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /submit/i }));

    await waitFor(() => {
      expect(onSubmit).not.toHaveBeenCalled();
      expect(screen.getAllByRole('alert').length).toBeGreaterThan(0);
    });

    fireEvent.change(screen.getByRole('textbox', { name: /full name/i }), {
      target: { value: 'Test Reference' },
    });
    fireEvent.change(screen.getByRole('textbox', { name: /email address/i }), {
      target: { value: 'ref@example.com' },
    });

    fireEvent.click(screen.getByRole('button', { name: /submit/i }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledTimes(1);
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          references: [
            expect.objectContaining({
              fullName: 'Test Reference',
              email: 'ref@example.com',
            }),
          ],
        }),
      );
    });
  });

  it('validates and formats postcode input using the specialised widget', async () => {
    const schema: UnifiedFormSchema = {
      $id: 'postcode-form',
      version: '1.0.0',
      metadata: {
        title: 'Postcode Form',
        description: 'Test form with postcode field',
        sensitivity: 'low',
      },
      steps: [
        {
          id: 'address',
          title: 'Address',
          schema: {
            type: 'object',
            properties: {
              postcode: { type: 'string', format: 'gb-postcode' },
            },
            required: ['postcode'],
          },
        },
      ],
      transitions: [],
      ui: {
        widgets: {
          postcode: { component: 'Postcode', label: 'Postcode' },
        },
      },
    };

    const onSubmit = jest.fn();
    render(<FormRenderer schema={schema} onSubmit={onSubmit} />);

    const input = await screen.findByRole('textbox', { name: /postcode/i });

    fireEvent.change(input, { target: { value: 'invalid' } });
    fireEvent.click(screen.getByRole('button', { name: /submit/i }));

    await waitFor(() => {
      expect(screen.getAllByRole('alert').length).toBeGreaterThan(0);
    });
    expect(onSubmit).not.toHaveBeenCalled();

    fireEvent.change(input, { target: { value: 'sw1a1aa' } });
    fireEvent.click(screen.getByRole('button', { name: /submit/i }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledTimes(1);
    });

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        postcode: 'SW1A 1AA',
      }),
    );
  });

  it('retries submission with exponential backoff on retryable errors', async () => {
    jest.useFakeTimers();
    try {
      const schema = buildSchema();
      const onSubmit = jest
        .fn()
        .mockRejectedValueOnce({ status: 500 })
        .mockRejectedValueOnce({ response: { status: 429 } })
        .mockResolvedValue(undefined);

      render(<FormRenderer schema={schema} onSubmit={onSubmit} />);

      fireEvent.change(await screen.findByRole('textbox', { name: /first name/i }), {
        target: { value: 'Retry' },
      });
      fireEvent.change(await screen.findByRole('textbox', { name: /last name/i }), {
        target: { value: 'Tester' },
      });

      fireEvent.click(await screen.findByRole('button', { name: /next/i }));

      await waitFor(() => {
        fireEvent.change(screen.getByRole('textbox', { name: /email/i }), {
          target: { value: 'retry@example.com' },
        });
      });

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /submit/i }));
      });

      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalledTimes(1);
      });

      expect(
        screen.getByText(/submission failed \(attempt 1 of 3\)\. retrying/i),
      ).toBeInTheDocument();

      await act(async () => {
        jest.advanceTimersByTime(500);
      });

      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalledTimes(2);
      });

      expect(
        screen.getByText(/submission failed \(attempt 2 of 3\)\. retrying/i),
      ).toBeInTheDocument();

      await act(async () => {
        jest.advanceTimersByTime(1000);
      });

      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalledTimes(3);
      });

      await waitFor(() => {
        expect(screen.queryByText(/retrying/i)).not.toBeInTheDocument();
      });
    } finally {
      jest.useRealTimers();
    }
  });

  it('saves a draft and surfaces a message after exhausting retries', async () => {
    jest.useFakeTimers();
    try {
      const schema = buildSchema();
      const onSubmit = jest.fn().mockRejectedValue({ status: 500 });

      render(<FormRenderer schema={schema} onSubmit={onSubmit} />);

      fireEvent.change(await screen.findByRole('textbox', { name: /first name/i }), {
        target: { value: 'Draft' },
      });
      fireEvent.change(await screen.findByRole('textbox', { name: /last name/i }), {
        target: { value: 'Saver' },
      });

      fireEvent.click(await screen.findByRole('button', { name: /next/i }));

      await waitFor(() => {
        fireEvent.change(screen.getByRole('textbox', { name: /email/i }), {
          target: { value: 'draft@example.com' },
        });
      });

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /submit/i }));
      });

      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalledTimes(1);
      });

      await act(async () => {
        jest.advanceTimersByTime(500);
      });
      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalledTimes(2);
      });

      await act(async () => {
        jest.advanceTimersByTime(1000);
      });
      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalledTimes(3);
      });

      await waitFor(() => {
        expect(saveDraftMock).toHaveBeenCalledTimes(1);
        expect(flushPendingSavesMock).toHaveBeenCalledTimes(1);
      });

      const [, , , options] = saveDraftMock.mock.calls[0];
      expect(options).toMatchObject({ manual: true, immediate: true });

      await waitFor(() => {
        expect(
          screen.getByText(/your progress was saved so you can try again shortly/i),
        ).toBeInTheDocument();
      });

      expect(PersistenceManager).toHaveBeenCalledTimes(1);
    } finally {
      jest.useRealTimers();
    }
  });

  it('surfaces offline guidance and saves a draft when submission fails offline', async () => {
    const schema = buildSchema();
    const offlineError = new TypeError('Failed to fetch');
    const onSubmit = jest.fn().mockRejectedValue(offlineError);
    const onlineSpy = jest.spyOn(window.navigator, 'onLine', 'get');
    onlineSpy.mockReturnValue(false);

    try {
      render(<FormRenderer schema={schema} onSubmit={onSubmit} />);

      fireEvent.change(await screen.findByRole('textbox', { name: /first name/i }), {
        target: { value: 'Offline' },
      });
      fireEvent.change(await screen.findByRole('textbox', { name: /last name/i }), {
        target: { value: 'User' },
      });

      fireEvent.click(await screen.findByRole('button', { name: /next/i }));

      await waitFor(() => {
        fireEvent.change(screen.getByRole('textbox', { name: /email/i }), {
          target: { value: 'offline@example.com' },
        });
      });

      fireEvent.click(screen.getByRole('button', { name: /submit/i }));

      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalledTimes(1);
      });

      await waitFor(() => {
        expect(saveDraftMock).toHaveBeenCalledTimes(1);
        expect(
          screen.getByText(
            /you appear to be offline\. we saved your progress so you can try again when you reconnect\./i,
          ),
        ).toBeInTheDocument();
      });
    } finally {
      onlineSpy.mockRestore();
    }
  });

  it('locks controls when the session expires and supports restarting', async () => {
    jest.useFakeTimers();

    const schema = buildSchema();
    schema.metadata.timeout = 0.02;

    render(<FormRenderer schema={schema} onSubmit={jest.fn()} />);

    expect(await screen.findByText(/session expires in/i)).toBeInTheDocument();

    await act(async () => {
      jest.advanceTimersByTime(1500);
    });

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /start new session/i })).toBeInTheDocument();
    });

    expect(screen.getByRole('button', { name: /^next$/i })).toBeDisabled();

    fireEvent.click(screen.getByRole('button', { name: /start new session/i }));

    await waitFor(() => {
      expect(deleteDraftMock).toHaveBeenCalled();
      expect(screen.getByRole('button', { name: /^next$/i })).not.toBeDisabled();
      expect(screen.getByText(/started a new session/i)).toBeInTheDocument();
    });
  });

  it('restores saved progress after session expiry when a draft exists', async () => {
    jest.useFakeTimers();

    const schema = buildSchema();
    schema.metadata.timeout = 0.02;

    loadDraftMock.mockResolvedValueOnce({
      data: { firstName: 'Saved', lastName: 'User', email: 'saved@example.com' },
      currentStep: 'contact',
      completedSteps: ['personal'],
    });

    render(<FormRenderer schema={schema} onSubmit={jest.fn()} />);

    await act(async () => {
      jest.advanceTimersByTime(1500);
    });

    const restoreButton = await screen.findByRole('button', { name: /restore saved draft/i });

    fireEvent.click(restoreButton);

    await waitFor(() => {
      expect(loadDraftMock).toHaveBeenCalled();
      expect(screen.getByText(/restored your saved progress/i)).toBeInTheDocument();
      expect(screen.getByRole('textbox', { name: /email/i })).toHaveValue('saved@example.com');
    });
  });

  it('falls back to the single-column layout when the grid flag is disabled', () => {
    const schema = buildSchema();
    schema.ui.layout = { type: 'grid' };
    process.env.NEXT_PUBLIC_FLAGS = 'gridLayout=false';

    const { container } = render(<FormRenderer schema={schema} onSubmit={jest.fn()} />);

    const form = container.querySelector('form');
    expect(form).toHaveAttribute('data-layout', 'single-column');
  });
});
