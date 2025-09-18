'use client';

import * as React from 'react';
import { Controller, type FieldValues } from 'react-hook-form';

import { cn } from '../../utils/cn';

import type { FocusEvt, TextareaChange } from '../../types/events';
import type { FieldProps } from './types';

export type TextAreaFieldProps<TFieldValues extends FieldValues = FieldValues> = FieldProps<
  TFieldValues,
  string | null
> & {
  rows?: number;
};

export const TextAreaField: React.FC<TextAreaFieldProps> = props => {
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
    componentProps,
    rows = 4
  } = props;

  const fieldId = id ?? name;
  const resolvedComponentProps = (componentProps ?? {}) as React.TextareaHTMLAttributes<HTMLTextAreaElement>;

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
    (event: TextareaChange) => {
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
          <textarea
            {...resolvedComponentProps}
            {...field}
            id={fieldId}
            value={(field.value as string | undefined) ?? ''}
            placeholder={placeholder}
            disabled={disabled}
            readOnly={readOnly}
            rows={rows}
            aria-describedby={ariaDescribedBy}
            aria-invalid={ariaInvalid ?? Boolean(fieldState.error)}
            aria-required={ariaRequired}
            className={cn(
              'block w-full rounded-md border px-3 py-2 text-sm',
              className,
              (ariaInvalid ?? Boolean(fieldState.error)) && 'border-destructive'
            )}
            onChange={(event: TextareaChange) => {
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
    <textarea
      {...resolvedComponentProps}
      id={fieldId}
      name={name}
      value={inputValue}
      defaultValue={defaultInputValue}
      placeholder={placeholder}
      disabled={disabled}
      readOnly={readOnly}
      rows={rows}
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
