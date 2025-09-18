'use client';

import * as React from 'react';
import { Controller } from 'react-hook-form';

import { cn } from '../../utils/cn';
import type { FieldProps } from './types';
import { withFieldWrapper } from './withFieldWrapper';

const NumberFieldComponent: React.FC<FieldProps> = ({
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
  min,
  max,
  step
}) => {
  const parseValue = (value: string) => (value === '' ? undefined : Number(value));

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
            type="number"
            inputMode="decimal"
            placeholder={placeholder}
            disabled={disabled}
            readOnly={readOnly}
            min={min as number | undefined}
            max={max as number | undefined}
            step={step as number | undefined}
            className={cn('block w-full rounded-md border px-3 py-2 text-sm', className, fieldState.error && 'border-red-500')}
            onChange={event => {
              const nextValue = parseValue(event.target.value);
              field.onChange(nextValue);
              onChange?.(nextValue);
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
      type="number"
      inputMode="decimal"
      defaultValue={defaultValue as string | number | undefined}
      placeholder={placeholder}
      disabled={disabled}
      readOnly={readOnly}
      min={min as number | undefined}
      max={max as number | undefined}
      step={step as number | undefined}
      className={cn('block w-full rounded-md border px-3 py-2 text-sm', className)}
      onChange={event => onChange?.(parseValue(event.target.value))}
      onBlur={onBlur}
    />
  );
};

export const NumberField = withFieldWrapper(NumberFieldComponent);
