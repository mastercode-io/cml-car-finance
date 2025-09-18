'use client';

import * as React from 'react';
import { Controller } from 'react-hook-form';

import { cn } from '../../utils/cn';
import type { FieldProps } from './types';
import { withFieldWrapper } from './withFieldWrapper';

const TextFieldComponent: React.FC<FieldProps> = ({
  name,
  control,
  rules,
  disabled,
  readOnly,
  placeholder,
  onChange,
  onBlur,
  className,
  defaultValue
}) => {
  if (control) {
    return (
      <Controller
        name={name}
        control={control}
        rules={rules}
        render={({ field, fieldState }) => (
          <input
            {...field}
            id={name}
            type="text"
            placeholder={placeholder}
            disabled={disabled}
            readOnly={readOnly}
            className={cn('block w-full rounded-md border px-3 py-2 text-sm', className, fieldState.error && 'border-red-500')}
            onChange={event => {
              field.onChange(event.target.value);
              onChange?.(event.target.value);
            }}
            onBlur={event => {
              field.onBlur();
              onBlur?.();
            }}
          />
        )}
      />
    );
  }

  return (
    <input
      id={name}
      name={name}
      type="text"
      defaultValue={defaultValue as string | number | readonly string[] | undefined}
      placeholder={placeholder}
      disabled={disabled}
      readOnly={readOnly}
      className={cn('block w-full rounded-md border px-3 py-2 text-sm', className)}
      onChange={event => onChange?.(event.target.value)}
      onBlur={onBlur}
    />
  );
};

export const TextField = withFieldWrapper(TextFieldComponent);
