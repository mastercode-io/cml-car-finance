'use client';

import * as React from 'react';
import { Controller, type FieldValues } from 'react-hook-form';

import { cn } from '../../utils/cn';

import type { FocusEvt, InputChange } from '../../types/events';
import type { FieldProps } from './types';

export type DateFieldProps<TFieldValues extends FieldValues = FieldValues> = FieldProps<
  TFieldValues,
  string | Date | null
> & {
  min?: string | Date;
  max?: string | Date;
};

const toInputValue = (value: unknown): string => {
  if (value instanceof Date) {
    return value.toISOString().split('T')[0] ?? '';
  }

  return typeof value === 'string' ? value : '';
};

const normalizeDateBoundary = (value?: string | Date): string | undefined => {
  if (!value) {
    return undefined;
  }

  if (value instanceof Date) {
    return value.toISOString().split('T')[0] ?? undefined;
  }

  return value;
};

const toDate = (value: string): Date | undefined => {
  if (!value) {
    return undefined;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
};

export const DateField: React.FC<DateFieldProps> = props => {
  const {
    id,
    name,
    control,
    rules,
    disabled,
    readOnly,
    onChange,
    onValueChange,
    onDateSelect,
    onBlur,
    onFocus,
    className,
    defaultValue,
    value,
    ariaDescribedBy,
    ariaInvalid,
    ariaRequired,
    componentProps,
    min,
    max
  } = props;

  const fieldId = id ?? name;
  const resolvedComponentProps = (componentProps ?? {}) as React.InputHTMLAttributes<HTMLInputElement>;

  const handleBlur = React.useCallback(
    (event: FocusEvt) => {
      onBlur?.(event);
    },
    [onBlur]
  );

  const handleFocus = React.useCallback(
    (event: FocusEvt) => {
      onFocus?.(event);
    },
    [onFocus]
  );

  const handleChange = React.useCallback(
    (event: InputChange) => {
      const nextValue = event.target.value;
      onChange?.(nextValue);
      onValueChange?.(nextValue);
      onDateSelect?.(toDate(nextValue));
    },
    [onChange, onDateSelect, onValueChange]
  );

  const minValue = normalizeDateBoundary(min);
  const maxValue = normalizeDateBoundary(max);

  if (control) {
    return (
      <Controller
        name={name}
        control={control}
        rules={rules}
        defaultValue={toInputValue(defaultValue)}
        render={({ field, fieldState }) => (
          <input
            {...resolvedComponentProps}
            {...field}
            id={fieldId}
            type="date"
            disabled={disabled}
            readOnly={readOnly}
            value={toInputValue(field.value)}
            min={minValue}
            max={maxValue}
            aria-describedby={ariaDescribedBy}
            aria-invalid={ariaInvalid ?? Boolean(fieldState.error)}
            aria-required={ariaRequired}
            className={cn(
              'block w-full rounded-md border px-3 py-2 text-sm',
              className,
              (ariaInvalid ?? Boolean(fieldState.error)) && 'border-destructive'
            )}
            onChange={(event: InputChange) => {
              field.onChange(event.target.value);
              handleChange(event);
            }}
            onBlur={(event: FocusEvt) => {
              field.onBlur();
              handleBlur(event);
            }}
            onFocus={handleFocus}
          />
        )}
      />
    );
  }

  const inputValue = value !== undefined ? toInputValue(value) : undefined;
  const defaultInputValue = inputValue === undefined ? toInputValue(defaultValue) : undefined;

  return (
    <input
      {...resolvedComponentProps}
      id={fieldId}
      name={name}
      type="date"
      disabled={disabled}
      readOnly={readOnly}
      value={inputValue}
      defaultValue={defaultInputValue}
      min={minValue}
      max={maxValue}
      aria-describedby={ariaDescribedBy}
      aria-invalid={ariaInvalid}
      aria-required={ariaRequired}
      className={cn('block w-full rounded-md border px-3 py-2 text-sm', className, ariaInvalid && 'border-destructive')}
      onChange={handleChange}
      onBlur={handleBlur}
      onFocus={handleFocus}
    />
  );
};
