import * as React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';

import { TextField } from '../../src/components/fields/TextField';
import { withFieldWrapper } from '../../src/components/fields/withFieldWrapper';

describe('TextField', () => {
  it('propagates value changes to handlers', () => {
    const handleChange = jest.fn();
    const handleValueChange = jest.fn();

    render(
      <TextField
        name="firstName"
        onChange={handleChange}
        onValueChange={handleValueChange}
      />
    );

    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'Jane' } });

    expect(handleChange).toHaveBeenCalledWith('Jane');
    expect(handleValueChange).toHaveBeenCalledWith('Jane');
  });

  it('wires accessibility attributes when wrapped', () => {
    const WrappedTextField = withFieldWrapper(TextField);

    render(
      <WrappedTextField
        name="email"
        label="Email address"
        description="We will use this to contact you"
        helpText="Use your work email"
        error="Email is required"
        required
      />
    );

    const input = screen.getByLabelText('Email address');
    const description = screen.getByText('We will use this to contact you');
    const help = screen.getByText('Use your work email');
    const error = screen.getByRole('alert');

    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAttribute('aria-required', 'true');

    const describedBy = input.getAttribute('aria-describedby');
    expect(describedBy).toBeTruthy();
    expect(describedBy).toEqual(expect.stringContaining(description.id));
    expect(describedBy).toEqual(expect.stringContaining(help.id));
    expect(describedBy).toEqual(expect.stringContaining(error.id));
  });
});
