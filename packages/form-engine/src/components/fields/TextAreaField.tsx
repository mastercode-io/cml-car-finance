'use client';

import * as React from 'react';
import { Controller } from 'react-hook-form';

import { cn } from '../../utils/cn';
import type { FieldProps } from './types';
import { withFieldWrapper } from './withFieldWrapper';

const TextAreaComponent: React.FC<FieldProps> = ({
  name,
  control,
  rules,
  disabled,
  readOnly,
  placeholder,
  onChange,
  onBlur,
  className,
  defaultValue,
  rows = 4
}) => {
  if (control) {
    return (
      <Controller
        name={name}
        control={control}
        rules={rules}
        render={({ field, fieldState }) => (
          <textarea
            {...field}
            id={name}
            placeholder={placeholder}
            disabled={disabled}
            readOnly={readOnly}
            rows={rows as number}
            className={cn(
              'block w-full rounded-md border px-3 py-2 text-sm',
              className,
              fieldState.error && 'border-red-500'
            )}
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
    <textarea
      id={name}
      name={name}
      defaultValue={defaultValue as string | undefined}
      placeholder={placeholder}
      disabled={disabled}
      readOnly={readOnly}
      rows={rows as number}
      className={cn('block w-full rounded-md border px-3 py-2 text-sm', className)}
      onChange={event => onChange?.(event.target.value)}
      onBlur={onBlur}
    />
  );
};

export const TextAreaField = withFieldWrapper(TextAreaComponent);
