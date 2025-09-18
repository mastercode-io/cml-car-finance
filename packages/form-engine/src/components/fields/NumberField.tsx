'use client';

import * as React from 'react';
import { Controller, type FieldValues } from 'react-hook-form';

import { cn } from '../../utils/cn';

import type { FocusEvt, InputChange } from '../../types/events';
import type { FieldProps } from './types';

export type NumberFieldProps<TFieldValues extends FieldValues = FieldValues> = FieldProps<
  TFieldValues,
  number | null
> & {
  min?: number;
  max?: number;
  step?: number;
};

const parseNumberValue = (value: string): number | null => {
  if (value === '') {
    return null;
  }

  const next = Number(value);
  return Number.isNaN(next) ? null : next;
};

export const NumberField: React.FC<NumberFieldProps> = props => {
  const {
    id,
    name,
    control,
    rules,
    disabled,
    readOnly,
    placeholder,
    onChange,
    onValueChange,
    onNumberChange,
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
    max,
    step
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

  const handleValueChange = React.useCallback(
    (event: InputChange) => {
      const nextValue = parseNumberValue(event.target.value);
      onChange?.(nextValue);
      onValueChange?.(nextValue);

      if (typeof nextValue === 'number') {
        onNumberChange?.(nextValue);
      }
    },
    [onChange, onNumberChange, onValueChange]
  );

  if (control) {
    return (
      <Controller
        name={name}
        control={control}
        rules={rules}
        defaultValue={
          typeof defaultValue === 'number' ? defaultValue : parseNumberValue(String(defaultValue ?? ''))
        }
        render={({ field, fieldState }) => (
          <input
            {...resolvedComponentProps}
            {...field}
            id={fieldId}
            type="number"
            inputMode="decimal"
            value={
              typeof field.value === 'number'
                ? field.value
                : parseNumberValue(String(field.value ?? '')) ?? ''
            }
            placeholder={placeholder}
            disabled={disabled}
            readOnly={readOnly}
            min={min}
            max={max}
            step={step}
            aria-describedby={ariaDescribedBy}
            aria-invalid={ariaInvalid ?? Boolean(fieldState.error)}
            aria-required={ariaRequired}
            className={cn(
              'block w-full rounded-md border px-3 py-2 text-sm',
              className,
              (ariaInvalid ?? Boolean(fieldState.error)) && 'border-destructive'
            )}
            onChange={(event: InputChange) => {
              const nextValue = parseNumberValue(event.target.value);
              field.onChange(nextValue);
              handleValueChange(event);
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

  const inputValue =
    value === undefined ? undefined : typeof value === 'number' ? value : value === null ? '' : undefined;

  const defaultInputValue =
    inputValue === undefined
      ? typeof defaultValue === 'number'
        ? defaultValue
        : parseNumberValue(String(defaultValue ?? '')) ?? undefined
      : undefined;

  return (
    <input
      {...resolvedComponentProps}
      id={fieldId}
      name={name}
      type="number"
      inputMode="decimal"
      value={inputValue}
      defaultValue={defaultInputValue}
      placeholder={placeholder}
      disabled={disabled}
      readOnly={readOnly}
      min={min}
      max={max}
      step={step}
      aria-describedby={ariaDescribedBy}
      aria-invalid={ariaInvalid}
      aria-required={ariaRequired}
      className={cn('block w-full rounded-md border px-3 py-2 text-sm', className, ariaInvalid && 'border-destructive')}
      onChange={handleValueChange}
      onBlur={handleBlur}
      onFocus={handleFocus}
    />
  );
};
