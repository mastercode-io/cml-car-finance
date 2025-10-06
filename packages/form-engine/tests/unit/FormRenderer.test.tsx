import * as React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { UnifiedFormSchema } from '@form-engine/types';
import { FormRenderer } from '@form-engine/index';
import { ValidationEngine } from '../../src/validation/ajv-setup';
import { TransitionEngine } from '../../src/rules/transition-engine';

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

const buildSchemaWithConditional = (retainHidden = false): UnifiedFormSchema => {
  const schema = buildSchema();
  schema.metadata = {
    ...schema.metadata,
    retainHidden,
  };
  schema.validation = {
    strategy: 'onChange',
    debounceMs: 100,
  };

  const contactStep = schema.steps.find((step) => step.id === 'contact');
  if (contactStep && 'properties' in contactStep.schema) {
    const contactSchema = contactStep.schema as any;
    contactSchema.properties = {
      ...contactSchema.properties,
      showExtras: { type: 'string' },
      loyaltyId: {
        type: 'string',
        'x-visibility': {
          op: 'eq',
          left: '$.showExtras',
          right: 'yes',
        },
      },
    };
  }

  schema.ui = {
    ...schema.ui,
    widgets: {
      ...schema.ui.widgets,
      showExtras: { component: 'Text', label: 'Show Extras' },
      loyaltyId: { component: 'Text', label: 'Loyalty ID' },
    },
  };

  return schema;
};

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

  it('defaults to blur-driven validation when no strategy is provided', async () => {
    const schema = buildSchema();

    render(<FormRenderer schema={schema} onSubmit={jest.fn()} />);

    const firstName = await screen.findByRole('textbox', { name: /first name/i });
    fireEvent.change(firstName, { target: { value: 'J' } });
    fireEvent.change(firstName, { target: { value: '' } });

    expect(screen.queryByRole('alert')).toBeNull();

    fireEvent.blur(firstName);

    await waitFor(() => {
      expect(screen.getAllByRole('alert').length).toBeGreaterThan(0);
    });
  });

  it('debounces on-change validation when debounceMs is provided', async () => {
    jest.useFakeTimers();
    const schema = buildSchema();
    schema.validation = { strategy: 'onChange', debounceMs: 200 };

    render(<FormRenderer schema={schema} onSubmit={jest.fn()} />);

    const firstName = await screen.findByRole('textbox', { name: /first name/i });
    fireEvent.change(firstName, { target: { value: 'A' } });
    fireEvent.change(firstName, { target: { value: '' } });

    expect(screen.queryByRole('alert')).toBeNull();

    act(() => {
      jest.advanceTimersByTime(199);
    });

    expect(screen.queryByRole('alert')).toBeNull();

    act(() => {
      jest.advanceTimersByTime(1);
    });

    await waitFor(() => {
      expect(screen.getAllByRole('alert').length).toBeGreaterThan(0);
    });
  });

  it('ignores transitions that resolve to the current step when nav.dedupeToken flag is enabled', async () => {
    process.env.NEXT_PUBLIC_FLAGS = 'nav.dedupeToken=true';
    const schema = buildSchema();
    const nextSpy = jest
      .spyOn(TransitionEngine.prototype, 'getNextStep')
      .mockReturnValue('personal');

    try {
      render(<FormRenderer schema={schema} onSubmit={jest.fn()} />);

      fireEvent.change(await screen.findByRole('textbox', { name: /first name/i }), {
        target: { value: 'Jane' },
      });
      fireEvent.change(screen.getByRole('textbox', { name: /last name/i }), {
        target: { value: 'Doe' },
      });

      const nextButton = await screen.findByRole('button', { name: /next/i });

      await act(async () => {
        fireEvent.click(nextButton);
      });

      expect(nextSpy).toHaveBeenCalledTimes(1);
      expect(screen.getByRole('heading', { name: /personal info/i })).toBeInTheDocument();
      expect(screen.queryByRole('heading', { name: /contact info/i })).not.toBeInTheDocument();
    } finally {
      nextSpy.mockRestore();
    }
  });

  it('ignores stale navigation tokens when a newer navigation completes first', async () => {
    process.env.NEXT_PUBLIC_FLAGS = 'nav.dedupeToken=true';
    const schema = buildSchema();

    // Intercept validation so we can resolve validations out of order
    const validationResolvers: Array<() => void> = [];
    const validationSpy = jest
      .spyOn(ValidationEngine.prototype, 'validate')
      .mockImplementation(((() => {
        return new Promise<Awaited<ReturnType<ValidationEngine['validate']>>>((resolve) => {
          validationResolvers.push(() =>
            resolve({ valid: true, errors: [], duration: 0 }),
          );
        });
      }) as unknown) as ValidationEngine['validate']);

    const nextSpy = jest
      .spyOn(TransitionEngine.prototype, 'getNextStep')
      .mockReturnValue('contact');

    try {
      render(<FormRenderer schema={schema} onSubmit={jest.fn()} />);

      fireEvent.change(await screen.findByRole('textbox', { name: /first name/i }), {
        target: { value: 'Jane' },
      });
      fireEvent.change(screen.getByRole('textbox', { name: /last name/i }), {
        target: { value: 'Doe' },
      });

      const nextButton = await screen.findByRole('button', { name: /next/i });
      fireEvent.click(nextButton);
      fireEvent.click(nextButton);

      expect(validationResolvers).toHaveLength(2);

      // Resolve the second validation first (newer token)
      await act(async () => {
        validationResolvers[1]();
        await Promise.resolve();
      });

      await waitFor(() => {
        expect(screen.getByRole('textbox', { name: /email/i })).toBeInTheDocument();
      });
      expect(nextSpy).toHaveBeenCalledTimes(1);

      // Now resolve the first (stale) validation; it should be ignored
      await act(async () => {
        validationResolvers[0]();
        await Promise.resolve();
      });

      await waitFor(() => {
        expect(screen.getByRole('textbox', { name: /email/i })).toBeInTheDocument();
      });
      expect(nextSpy).toHaveBeenCalledTimes(1);
    } finally {
      validationSpy.mockRestore();
      validationResolvers.length = 0;
      nextSpy.mockRestore();
    }
  });

  it('keeps the user on the override step when a subsequent navigation cancels the original request', async () => {
    process.env.NEXT_PUBLIC_FLAGS = 'nav.dedupeToken=true';
    const schema = buildSchema();
    schema.steps.push({
      id: 'review',
      title: 'Review',
      schema: { type: 'object', properties: {} },
    });
    schema.transitions.push({ from: 'contact', to: 'review', default: true });

    const validationResolvers: Array<() => void> = [];
    const validationSpy = jest
      .spyOn(ValidationEngine.prototype, 'validate')
      .mockImplementation(((() => {
        return new Promise<Awaited<ReturnType<ValidationEngine['validate']>>>((resolve) => {
          validationResolvers.push(() =>
            resolve({ valid: true, errors: [], duration: 0 }),
          );
        });
      }) as unknown) as ValidationEngine['validate']);

    try {
      render(<FormRenderer schema={schema} onSubmit={jest.fn()} />);

      fireEvent.change(await screen.findByRole('textbox', { name: /first name/i }), {
        target: { value: 'Jane' },
      });
      fireEvent.change(screen.getByRole('textbox', { name: /last name/i }), {
        target: { value: 'Doe' },
      });

      const firstNextButton = await screen.findByRole('button', { name: /next/i });

      await act(async () => {
        fireEvent.click(firstNextButton);
      });

      expect(validationResolvers).toHaveLength(1);

      await act(async () => {
        validationResolvers.shift()?.();
        await Promise.resolve();
      });

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /contact info/i })).toBeInTheDocument();
      });

      fireEvent.change(screen.getByRole('textbox', { name: /email/i }), {
        target: { value: 'jane@example.com' },
      });

      const secondNextButton = await screen.findByRole('button', { name: /next/i });

      await act(async () => {
        fireEvent.click(secondNextButton);
      });

      expect(validationResolvers).toHaveLength(1);

      const previousButton = await screen.findByRole('button', { name: /previous/i });
      await act(async () => {
        fireEvent.click(previousButton);
      });

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /personal info/i })).toBeInTheDocument();
      });

      await act(async () => {
        validationResolvers.shift()?.();
        await Promise.resolve();
      });

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /personal info/i })).toBeInTheDocument();
      });
      expect(
        screen.queryByRole('heading', { name: /review/i }),
      ).not.toBeInTheDocument();
    } finally {
      validationSpy.mockRestore();
      validationResolvers.length = 0;
    }
  });

  it('defers validation until submit when strategy is onSubmit', async () => {
    const schema = buildSchema();
    schema.validation = { strategy: 'onSubmit' };

    render(<FormRenderer schema={schema} onSubmit={jest.fn()} />);

    expect(await screen.findByRole('textbox', { name: /first name/i })).toBeInTheDocument();

    const nextButton = await screen.findByRole('button', { name: /next/i });
    await act(async () => {
      fireEvent.click(nextButton);
    });

    expect(screen.getByRole('textbox', { name: /email/i })).toBeInTheDocument();

    expect(screen.queryByRole('alert')).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: /submit/i }));

    await waitFor(() => {
      expect(screen.getAllByRole('alert').length).toBeGreaterThan(0);
      expect(screen.getByRole('textbox', { name: /email/i })).toBeInTheDocument();
    });
  });

  it('shows an invalid submission banner when submit validation fails', async () => {
    const schema = buildSchema();

    render(<FormRenderer schema={schema} onSubmit={jest.fn()} />);

    fireEvent.change(await screen.findByRole('textbox', { name: /first name/i }), {
      target: { value: 'Sam' },
    });
    fireEvent.change(await screen.findByRole('textbox', { name: /last name/i }), {
      target: { value: 'Taylor' },
    });

    fireEvent.click(await screen.findByRole('button', { name: /next/i }));

    await waitFor(() => {
      expect(screen.getByRole('textbox', { name: /email/i })).toBeInTheDocument();
    });

    fireEvent.click(await screen.findByRole('button', { name: /submit/i }));

    await waitFor(() => {
      expect(
        screen.getByText(
          'Please review the highlighted fields: One or more fields require your attention.',
        ),
      ).toBeInTheDocument();
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

      await act(async () => {
        fireEvent.click(await screen.findByRole('button', { name: /next/i }));
      });

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

      await act(async () => {
        fireEvent.click(await screen.findByRole('button', { name: /next/i }));
      });

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

      await act(async () => {
        const form = document.querySelector('form');
        if (!form) {
          throw new Error('Form element not found');
        }
        fireEvent.submit(form);
      });

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

  it('treats network type errors as offline even when navigator reports online', async () => {
    const schema = buildSchema();
    const offlineError = new TypeError('NetworkError when attempting to fetch resource.');
    const onSubmit = jest.fn().mockRejectedValue(offlineError);

    render(<FormRenderer schema={schema} onSubmit={onSubmit} />);

    fireEvent.change(await screen.findByRole('textbox', { name: /first name/i }), {
      target: { value: 'Network' },
    });
    fireEvent.change(await screen.findByRole('textbox', { name: /last name/i }), {
      target: { value: 'Error' },
    });

    fireEvent.click(await screen.findByRole('button', { name: /next/i }));

    await waitFor(() => {
      fireEvent.change(screen.getByRole('textbox', { name: /email/i }), {
        target: { value: 'network@example.com' },
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
  });

  it('flushes pending validation before submit and omits hidden fields when retainHidden is false', async () => {
    const validateSpy = jest
      .spyOn(ValidationEngine.prototype, 'validate')
      .mockResolvedValue({ valid: true, errors: [] });

    const schema = buildSchemaWithConditional(false);
    const onSubmit = jest.fn().mockResolvedValue(undefined);
    const onValidationError = jest.fn();

    render(
      <FormRenderer
        schema={schema}
        onSubmit={onSubmit}
        onValidationError={onValidationError}
        initialData={{ email: 'prefill@example.com', showExtras: 'yes', loyaltyId: 'prefill' }}
      />,
    );

    fireEvent.change(await screen.findByRole('textbox', { name: /first name/i }), {
      target: { value: 'Jane' },
    });
    fireEvent.change(screen.getByRole('textbox', { name: /last name/i }), {
      target: { value: 'Doe' },
    });

    const nextButton = await screen.findByRole('button', { name: /next/i });
    await act(async () => {
      fireEvent.click(nextButton);
    });

    const emailInput = await screen.findByRole('textbox', { name: /email/i });
    fireEvent.change(emailInput, {
      target: { value: 'fresh@example.com' },
    });

    const showExtrasInput = screen.getByRole('textbox', { name: /show extras/i });
    const loyaltyInput = screen.getByRole('textbox', { name: /loyalty id/i });
    fireEvent.change(loyaltyInput, { target: { value: 'HiddenValue' } });

    fireEvent.change(showExtrasInput, { target: { value: 'no' } });

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /submit/i }));
    });

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledTimes(1);
    });

    expect(onValidationError).not.toHaveBeenCalled();

    const payload = onSubmit.mock.calls[0][0];
    expect(payload).toMatchObject({
      email: 'fresh@example.com',
      showExtras: 'no',
    });
    expect(payload).not.toHaveProperty('loyaltyId');
    expect(payload._meta).toEqual(
      expect.objectContaining({
        schemaId: schema.$id,
        schemaVersion: schema.version,
      }),
    );

    validateSpy.mockRestore();
  });

  it('retains hidden field values when schema metadata retainHidden is true', async () => {
    const validateSpy = jest
      .spyOn(ValidationEngine.prototype, 'validate')
      .mockResolvedValue({ valid: true, errors: [] });

    const schema = buildSchemaWithConditional(true);
    const onSubmit = jest.fn().mockResolvedValue(undefined);
    const onValidationError = jest.fn();

    render(
      <FormRenderer
        schema={schema}
        onSubmit={onSubmit}
        onValidationError={onValidationError}
        initialData={{ email: 'prefill@example.com', showExtras: 'yes', loyaltyId: 'prefill' }}
      />,
    );

    fireEvent.change(await screen.findByRole('textbox', { name: /first name/i }), {
      target: { value: 'Harper' },
    });
    fireEvent.change(screen.getByRole('textbox', { name: /last name/i }), {
      target: { value: 'Lee' },
    });

    const nextButton = await screen.findByRole('button', { name: /next/i });
    await act(async () => {
      fireEvent.click(nextButton);
    });

    const emailInput = await screen.findByRole('textbox', { name: /email/i });
    fireEvent.change(emailInput, {
      target: { value: 'retain@example.com' },
    });

    const showExtrasInput = screen.getByRole('textbox', { name: /show extras/i });
    const loyaltyInput = screen.getByRole('textbox', { name: /loyalty id/i });
    fireEvent.change(loyaltyInput, { target: { value: 'StillHere' } });

    fireEvent.change(showExtrasInput, { target: { value: 'no' } });

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /submit/i }));
    });

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledTimes(1);
    });

    validateSpy.mockRestore();
    expect(onValidationError).not.toHaveBeenCalled();

    const payload = onSubmit.mock.calls[0][0];
    expect(payload).toMatchObject({
      loyaltyId: 'StillHere',
      showExtras: 'no',
    });
  });

  it('calls onSubmit only once when submit is triggered multiple times quickly', async () => {
    const schema = buildSchema();
    let resolveSubmit: (() => void) | undefined;
    const onSubmit = jest.fn(
      () =>
        new Promise<void>((resolve) => {
          resolveSubmit = resolve;
        }),
    );

    render(<FormRenderer schema={schema} onSubmit={onSubmit} />);

    fireEvent.change(await screen.findByRole('textbox', { name: /first name/i }), {
      target: { value: 'Rapid' },
    });
    fireEvent.change(screen.getByRole('textbox', { name: /last name/i }), {
      target: { value: 'Clicker' },
    });

    const nextButton = await screen.findByRole('button', { name: /next/i });
    await act(async () => {
      fireEvent.click(nextButton);
    });

    const emailInput = await screen.findByRole('textbox', { name: /email/i });
    fireEvent.change(emailInput, { target: { value: 'rapid@click.com' } });

    const submitButton = screen.getByRole('button', { name: /submit/i });

    await act(async () => {
      fireEvent.click(submitButton);
      fireEvent.click(submitButton);
    });

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledTimes(1);
      expect(typeof resolveSubmit).toBe('function');
    });

    await act(async () => {
      resolveSubmit?.();
    });

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledTimes(1);
    });
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

  it('renders the grid layout when both schema and flag opt in', async () => {
    process.env.NEXT_PUBLIC_FLAGS = 'gridLayout=true';
    const schema = buildSchema();

    const personalStep = schema.steps.find((step) => step.id === 'personal');
    if (personalStep && 'properties' in personalStep.schema) {
      (personalStep.schema as any).properties.middleName = { type: 'string' };
      personalStep.schema.required = ['firstName', 'lastName'];
    }

    schema.ui.widgets.middleName = { component: 'Text', label: 'Middle Name' };
    schema.ui.layout = {
      type: 'grid',
      gutter: 12,
      breakpoints: { base: 1, md: 2 },
      sections: [
        {
          id: 'primary',
          title: 'Primary Info',
          rows: [{ fields: ['firstName', 'lastName'], colSpan: { md: 1 } }],
        },
      ],
    };

    const { container } = render(<FormRenderer schema={schema} onSubmit={jest.fn()} />);

    const form = container.querySelector('form');
    expect(form).toHaveAttribute('data-layout', 'grid');

    await waitFor(() => {
      expect(screen.getByRole('textbox', { name: /first name/i })).toBeInTheDocument();
      expect(screen.getByRole('textbox', { name: /middle name/i })).toBeInTheDocument();
    });

    expect(
      container.querySelector('[data-grid-section="primary"]'),
    ).toBeInTheDocument();
  });

  it('honors gridBreakpointOverride when provided', () => {
    process.env.NEXT_PUBLIC_FLAGS = 'gridLayout=true';
    const schema = buildSchema();
    schema.ui.layout = {
      type: 'grid',
      sections: [{ id: 'default', rows: [{ fields: ['firstName'] }] }],
    };

    const { container } = render(
      <FormRenderer schema={schema} onSubmit={jest.fn()} gridBreakpointOverride="lg" />,
    );

    const gridContainer = container.querySelector('[data-grid-breakpoint]');
    expect(gridContainer).toHaveAttribute('data-grid-breakpoint', 'lg');
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