'use client';

import * as React from 'react';
import { Controller, type FieldValues } from 'react-hook-form';

import { cn } from '../../utils/cn';

import type { FocusEvt, InputChange } from '../../types/events';
import type { FieldProps } from './types';

export type TextFieldProps<TFieldValues extends FieldValues = FieldValues> = FieldProps<
  TFieldValues,
  string | null
>;

export const TextField: React.FC<TextFieldProps> = props => {
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
    onBlur,
    onFocus,
    className,
    defaultValue,
    value,
    ariaDescribedBy,
    ariaInvalid,
    ariaRequired,
    componentProps
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
    },
    [onChange, onValueChange]
  );

  if (control) {
    return (
      <Controller
        name={name}
        control={control}
        rules={rules}
        defaultValue={(defaultValue as string | undefined) ?? ''}
        render={({ field, fieldState }) => (
          <input
            {...resolvedComponentProps}
            {...field}
            id={fieldId}
            type="text"
            value={(field.value as string | undefined) ?? ''}
            placeholder={placeholder}
            disabled={disabled}
            readOnly={readOnly}
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

  const inputValue = value === null || value === undefined ? undefined : (value as string);
  const defaultInputValue = inputValue === undefined
    ? (defaultValue === null || defaultValue === undefined
        ? undefined
        : (defaultValue as string))
    : undefined;

  return (
    <input
      {...resolvedComponentProps}
      id={fieldId}
      name={name}
      type="text"
      value={inputValue}
      defaultValue={defaultInputValue}
      placeholder={placeholder}
      disabled={disabled}
      readOnly={readOnly}
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
