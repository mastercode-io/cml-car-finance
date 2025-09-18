'use client';

import * as React from 'react';
import { Controller } from 'react-hook-form';

import { cn } from '../../utils/cn';
import type { FieldProps } from './types';
import { withFieldWrapper } from './withFieldWrapper';

const DateFieldComponent: React.FC<FieldProps> = ({
  name,
  control,
  rules,
  disabled,
  readOnly,
  onChange,
  onBlur,
  className,
  defaultValue,
  min,
  max
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
            type="date"
            disabled={disabled}
            readOnly={readOnly}
            min={min as string | undefined}
            max={max as string | undefined}
            className={cn('block w-full rounded-md border px-3 py-2 text-sm', className, fieldState.error && 'border-red-500')}
            onChange={event => {
              field.onChange(event.target.value);
              onChange?.(event.target.value);
            }}
            onBlur={() => {
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
      type="date"
      defaultValue={defaultValue as string | undefined}
      disabled={disabled}
      readOnly={readOnly}
      min={min as string | undefined}
      max={max as string | undefined}
      className={cn('block w-full rounded-md border px-3 py-2 text-sm', className)}
      onChange={event => onChange?.(event.target.value)}
      onBlur={onBlur}
    />
  );
};

export const DateField = withFieldWrapper(DateFieldComponent);
