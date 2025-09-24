import * as React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { FormProvider, useForm, type UseFormReturn } from 'react-hook-form';

import { FieldRegistry, initializeFieldRegistry } from '@form-engine/index';
import { RepeaterField } from '@form-engine/components/fields/RepeaterField';

type FormValues = {
  references: Array<{ fullName?: string; email?: string }>;
};

describe('RepeaterField', () => {
  beforeEach(() => {
    FieldRegistry.reset();
    initializeFieldRegistry();
  });

  const Wrapper: React.FC<{
    defaultValues?: FormValues;
    onReady?: (methods: UseFormReturn<FormValues>) => void;
    componentOverrides?: { minItems?: number; maxItems?: number };
  }> = ({ defaultValues, onReady, componentOverrides }) => {
    const methods = useForm<FormValues>({ defaultValues });

    React.useEffect(() => {
      onReady?.(methods);
    }, [methods, onReady]);

    return (
      <FormProvider {...methods}>
        <RepeaterField
          name="references"
          label="References"
          control={methods.control}
          componentProps={{
            itemLabel: 'Reference',
            minItems: 1,
            maxItems: 2,
            addButtonLabel: 'Add reference',
            removeButtonLabel: 'Remove reference',
            fields: [
              { name: 'fullName', component: 'Text', label: 'Full name', required: true },
              { name: 'email', component: 'Email', label: 'Email address', required: true },
            ],
            ...componentOverrides,
          }}
        />
      </FormProvider>
    );
  };

  it('renders the minimum number of items on mount and blocks removal when at min', async () => {
    render(<Wrapper defaultValues={{ references: [] }} />);

    expect(await screen.findByText(/^Reference 1$/i)).toBeInTheDocument();
    const removeButtons = screen.getAllByRole('button', { name: /remove reference/i });
    fireEvent.click(removeButtons[0]);

    expect(await screen.findByText(/^Reference 1$/i)).toBeInTheDocument();
  });

  it('adds and removes items within min/max bounds', async () => {
    render(<Wrapper defaultValues={{ references: [] }} />);

    const addButton = await screen.findByRole('button', { name: /add reference/i });
    fireEvent.click(addButton);

    expect(await screen.findByText(/^Reference 2$/i)).toBeInTheDocument();
    expect(addButton).toBeDisabled();

    const removeButtons = screen.getAllByRole('button', { name: /remove reference/i });
    fireEvent.click(removeButtons[1]);

    await waitFor(() => {
      expect(screen.queryByText(/^Reference 2$/i)).not.toBeInTheDocument();
    });
    expect(addButton).not.toBeDisabled();
  });

  it('reorders items when move controls are used', async () => {
    render(
      <Wrapper
        defaultValues={{
          references: [
            { fullName: 'Alice Example', email: 'alice@example.com' },
            { fullName: 'Brian Example', email: 'brian@example.com' },
          ],
        }}
      />,
    );

    const moveDownButton = await screen.findByRole('button', {
      name: /move down reference 1/i,
    });
    fireEvent.click(moveDownButton);

    const nameInputs = await screen.findAllByRole('textbox', { name: /full name/i });
    expect(nameInputs[0]).toHaveValue('Brian Example');
  });

  it('focuses the newly added item when appended', async () => {
    render(<Wrapper defaultValues={{ references: [] }} />);

    const addButton = await screen.findByRole('button', { name: /add reference/i });

    act(() => {
      fireEvent.click(addButton);
    });

    const nameInputs = await screen.findAllByRole('textbox', { name: /full name/i });

    await waitFor(() => {
      expect(nameInputs).toHaveLength(2);
      expect(document.activeElement).toBe(nameInputs[1]);
    });
  });

  it('focuses the next item when one is removed', async () => {
    render(
      <Wrapper
        defaultValues={{
          references: [
            { fullName: 'Alice Example', email: 'alice@example.com' },
            { fullName: 'Brian Example', email: 'brian@example.com' },
          ],
        }}
      />,
    );

    const removeButtons = await screen.findAllByRole('button', { name: /remove reference/i });

    act(() => {
      fireEvent.click(removeButtons[0]);
    });

    const remainingInput = await screen.findByRole('textbox', { name: /full name/i });

    await waitFor(() => {
      expect(document.activeElement).toBe(remainingInput);
    });
  });

  it('returns focus to the add button when the last item is removed', async () => {
    render(
      <Wrapper
        defaultValues={{
          references: [{ fullName: 'Solo Example', email: 'solo@example.com' }],
        }}
        componentOverrides={{ minItems: 0 }}
      />,
    );

    const addButton = await screen.findByRole('button', { name: /add reference/i });
    const removeButton = await screen.findByRole('button', { name: /remove reference/i });

    act(() => {
      fireEvent.click(removeButton);
    });

    await waitFor(() => {
      expect(screen.queryByText(/^Reference 1$/i)).not.toBeInTheDocument();
    });

    await waitFor(() => {
      expect(document.activeElement).toBe(addButton);
    });
  });

  it('keeps focus on the moved item after reordering', async () => {
    render(
      <Wrapper
        defaultValues={{
          references: [
            { fullName: 'Alice Example', email: 'alice@example.com' },
            { fullName: 'Brian Example', email: 'brian@example.com' },
          ],
        }}
      />,
    );

    const moveDownButton = await screen.findByRole('button', { name: /move down reference 1/i });

    act(() => {
      fireEvent.click(moveDownButton);
    });

    const movedInput = await screen.findByDisplayValue('Alice Example');

    await waitFor(() => {
      expect(document.activeElement).toBe(movedInput);
    });
  });

  it('surfaces nested validation errors', async () => {
    let methodsRef: UseFormReturn<FormValues> | undefined;

    render(
      <Wrapper
        defaultValues={{ references: [{}] }}
        onReady={(methods) => {
          methodsRef = methods;
        }}
      />,
    );

    await act(async () => {
      methodsRef?.setError('references.0.fullName', {
        type: 'required',
        message: 'Required field',
      });
    });

    expect(await screen.findByText(/required field/i)).toBeInTheDocument();
  });
});
