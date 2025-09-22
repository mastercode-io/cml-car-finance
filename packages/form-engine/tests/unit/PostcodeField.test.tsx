import * as React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { FormProvider, useForm } from 'react-hook-form';

import { PostcodeField } from '../../src/components/fields/specialized/PostcodeField';

describe('PostcodeField', () => {
  it('auto formats input values and notifies handlers', () => {
    const handleChange = jest.fn();
    const handleValueChange = jest.fn();

    render(
      <PostcodeField name="postcode" onChange={handleChange} onValueChange={handleValueChange} />,
    );

    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'sw1a1aa' } });

    expect(input).toHaveValue('SW1A 1AA');
    expect(handleChange).toHaveBeenCalledWith('SW1A 1AA');
    expect(handleValueChange).toHaveBeenCalledWith('SW1A 1AA');
  });

  it('supports disabling auto format via prop', () => {
    render(<PostcodeField name="postcode" autoFormat={false} />);

    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'sw1a1aa' } });

    expect(input).toHaveValue('SW1A1AA');
  });

  it('works with react-hook-form control and submits formatted values', async () => {
    const handleSubmit = jest.fn();

    const TestForm: React.FC = () => {
      const methods = useForm<{ postcode: string }>({ defaultValues: { postcode: '' } });

      return (
        <FormProvider {...methods}>
          <form onSubmit={methods.handleSubmit(handleSubmit)}>
            <PostcodeField name="postcode" control={methods.control} />
            <button type="submit">Submit</button>
          </form>
        </FormProvider>
      );
    };

    render(<TestForm />);

    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'ec1a1bb' } });
    fireEvent.click(screen.getByRole('button', { name: /submit/i }));

    await waitFor(() => {
      expect(handleSubmit).toHaveBeenCalledTimes(1);
    });

    expect(handleSubmit.mock.calls[0]?.[0]).toEqual({ postcode: 'EC1A 1BB' });
  });
});
