import * as React from 'react';
import { render, screen } from '@testing-library/react';

import type { FieldProps } from '../../src/components/fields/types';
import { withFieldWrapper } from '../../src/components/fields/withFieldWrapper';

describe('withFieldWrapper', () => {
  const BaseField: React.FC<FieldProps> = ({
    id,
    name,
    ariaDescribedBy,
    ariaInvalid,
    ariaRequired,
    componentProps
  }) => (
    <input
      data-testid="base-field"
      id={id}
      name={name}
      aria-describedby={ariaDescribedBy ?? undefined}
      aria-invalid={ariaInvalid ? 'true' : undefined}
      aria-required={ariaRequired ? 'true' : undefined}
      {...(componentProps as React.InputHTMLAttributes<HTMLInputElement>)}
    />
  );

  it('renders label, helpers, and accessibility wiring', () => {
    const Wrapped = withFieldWrapper(BaseField);

    render(
      <Wrapped
        name="example"
        label="Example label"
        description="This is a description"
        helpText="Helpful details"
        error="Something went wrong"
        required
        ariaDescribedBy="custom"
      />
    );

    const wrapper = document.querySelector('[data-field-wrapper]');
    expect(wrapper).toBeInTheDocument();

    const errorSlot = wrapper?.querySelector('[data-field-error-slot]') as HTMLElement;
    expect(errorSlot).toBeInTheDocument();
    expect(errorSlot.style.minHeight).toBe('var(--grid-field-error-slot, 0px)');

    const input = screen.getByRole('textbox', { name: /Example label/i });
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAttribute('aria-required', 'true');

    const describedBy = input.getAttribute('aria-describedby');
    expect(describedBy).toBeTruthy();

    const description = screen.getByText('This is a description');
    const help = screen.getByText('Helpful details');
    const error = screen.getByRole('alert');

    expect(describedBy).toEqual(
      expect.stringContaining(description.id)
    );
    expect(describedBy).toEqual(expect.stringContaining(help.id));
    expect(describedBy).toEqual(expect.stringContaining(error.id));
    expect(describedBy).toEqual(expect.stringContaining('custom'));
  });
});
