'use client';

import * as React from 'react';
import { Controller, type FieldValues } from 'react-hook-form';

import { cn } from '../../utils/cn';

import type { FocusEvt, SelectChange } from '../../types/events';
import type { FieldProps } from './types';

interface SelectOption {
  label: string;
  value: string | number;
}

export type SelectFieldProps<TFieldValues extends FieldValues = FieldValues> = FieldProps<
  TFieldValues,
  string | number | null
> & {
  options?: SelectOption[];
  placeholder?: string;
};

const getOptionValue = (value: string, options: SelectOption[]): string | number => {
  const matched = options.find(option => String(option.value) === value);
  return matched ? matched.value : value;
};

export const SelectField: React.FC<SelectFieldProps> = props => {
  const {
    id,
    name,
    control,
    rules,
    disabled,
    onChange,
    onValueChange,
    onBlur,
    onFocus,
    className,
    defaultValue,
    value,
    ariaDescribedBy,
    ariaInvalid,
    ariaRequired,
    componentProps,
    options = [],
    placeholder
  } = props;

  const fieldId = id ?? name;
  const resolvedComponentProps = (componentProps ?? {}) as React.SelectHTMLAttributes<HTMLSelectElement>;

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
    (event: SelectChange) => {
      const nextValue = getOptionValue(event.target.value, options);
      onChange?.(nextValue);
      onValueChange?.(nextValue);
    },
    [onChange, onValueChange, options]
  );

  const renderOptions = () =>
    options.map(option => (
      <option key={option.value} value={option.value}>
        {option.label}
      </option>
    ));

  if (control) {
    return (
      <Controller
        name={name}
        control={control}
        rules={rules}
        defaultValue={
          defaultValue === null || defaultValue === undefined
            ? undefined
            : (defaultValue as string | number)
        }
        render={({ field, fieldState }) => (
          <select
            {...resolvedComponentProps}
            {...field}
            id={fieldId}
            disabled={disabled}
            aria-describedby={ariaDescribedBy}
            aria-invalid={ariaInvalid ?? Boolean(fieldState.error)}
            aria-required={ariaRequired}
            className={cn(
              'block w-full rounded-md border px-3 py-2 text-sm',
              className,
              (ariaInvalid ?? Boolean(fieldState.error)) && 'border-destructive'
            )}
            onChange={(event: SelectChange) => {
              const nextValue = getOptionValue(event.target.value, options);
              field.onChange(nextValue);
              handleChange(event);
            }}
            onBlur={(event: FocusEvt) => {
              field.onBlur();
              handleBlur(event);
            }}
            onFocus={handleFocus}
          >
            {placeholder ? (
              <option value="" disabled>
                {placeholder}
              </option>
            ) : null}
            {renderOptions()}
          </select>
        )}
      />
    );
  }

  const selectValue =
    value === null || value === undefined ? undefined : (value as string | number);
  const defaultSelectValue =
    selectValue === undefined
      ? defaultValue === null || defaultValue === undefined
        ? undefined
        : (defaultValue as string | number)
      : undefined;

  return (
    <select
      {...resolvedComponentProps}
      id={fieldId}
      name={name}
      value={selectValue}
      defaultValue={defaultSelectValue}
      disabled={disabled}
      aria-describedby={ariaDescribedBy}
      aria-invalid={ariaInvalid}
      aria-required={ariaRequired}
      className={cn('block w-full rounded-md border px-3 py-2 text-sm', className, ariaInvalid && 'border-destructive')}
      onChange={handleChange}
      onBlur={handleBlur}
      onFocus={handleFocus}
    >
      {placeholder ? <option value="">{placeholder}</option> : null}
      {renderOptions()}
    </select>
  );
};
