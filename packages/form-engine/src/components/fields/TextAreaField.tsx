'use client';

import * as React from 'react';
import { Controller, type FieldValues } from 'react-hook-form';

import { Textarea } from '../ui/textarea';
import { cn } from '../../utils/cn';

import type { FocusEvt, TextareaChange } from '../../types/events';
import type { FieldProps } from './types';

export type TextAreaFieldProps<TFieldValues extends FieldValues = FieldValues> = FieldProps<
  TFieldValues,
  string | null
> & {
  rows?: number;
};

export const TextAreaField: React.FC<TextAreaFieldProps> = (props) => {
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
    rows = 4,
  } = props;

  const fieldId = id ?? name;
  const resolvedComponentProps = (componentProps ?? {}) as React.ComponentProps<typeof Textarea>;
  const {
    className: componentClassName,
    onChange: componentOnChange,
    onBlur: componentOnBlur,
    onFocus: componentOnFocus,
    defaultValue: componentDefaultValue,
    placeholder: componentPlaceholder,
    disabled: componentDisabled,
    readOnly: componentReadOnly,
    rows: componentRows,
    ...restComponentProps
  } = resolvedComponentProps;
  const resolvedRows =
    rows ??
    (typeof componentRows === 'number'
      ? componentRows
      : componentRows
        ? Number(componentRows)
        : undefined) ??
    4;

  const handleBlur = React.useCallback(
    (event: FocusEvt) => {
      onBlur?.(event);
    },
    [onBlur],
  );

  const handleFocus = React.useCallback(
    (event: FocusEvt) => {
      onFocus?.(event);
    },
    [onFocus],
  );

  const handleChange = React.useCallback(
    (event: TextareaChange) => {
      const nextValue = event.target.value;
      onChange?.(nextValue);
      onValueChange?.(nextValue);
    },
    [onChange, onValueChange],
  );

  if (control) {
    return (
      <Controller
        name={name}
        control={control}
        rules={rules}
        defaultValue={(defaultValue as string | undefined) ?? ''}
        render={({ field, fieldState }) => (
          <Textarea
            {...restComponentProps}
            id={fieldId}
            value={(field.value as string | undefined) ?? ''}
            placeholder={placeholder ?? componentPlaceholder}
            disabled={disabled ?? componentDisabled}
            readOnly={readOnly ?? componentReadOnly}
            rows={resolvedRows}
            aria-describedby={ariaDescribedBy}
            aria-invalid={ariaInvalid ?? Boolean(fieldState.error)}
            aria-required={ariaRequired}
            className={cn(
              componentClassName,
              className,
              (ariaInvalid ?? Boolean(fieldState.error)) && 'border-destructive',
            )}
            onChange={(event: TextareaChange) => {
              componentOnChange?.(event);
              field.onChange(event.target.value);
              handleChange(event);
            }}
            onBlur={(event: React.FocusEvent<HTMLTextAreaElement>) => {
              componentOnBlur?.(event);
              field.onBlur();
              handleBlur(event as FocusEvt);
            }}
            onFocus={(event: React.FocusEvent<HTMLTextAreaElement>) => {
              componentOnFocus?.(event);
              handleFocus(event as FocusEvt);
            }}
            ref={field.ref}
          />
        )}
      />
    );
  }

  const inputValue = value === null || value === undefined ? undefined : (value as string);
  const defaultInputValue =
    inputValue === undefined
      ? defaultValue === null || defaultValue === undefined
        ? undefined
        : (defaultValue as string)
      : undefined;

  return (
    <Textarea
      {...restComponentProps}
      id={fieldId}
      name={name}
      value={inputValue}
      defaultValue={defaultInputValue ?? (componentDefaultValue as string | undefined)}
      placeholder={placeholder ?? componentPlaceholder}
      disabled={disabled ?? componentDisabled}
      readOnly={readOnly ?? componentReadOnly}
      rows={resolvedRows}
      aria-describedby={ariaDescribedBy}
      aria-invalid={ariaInvalid}
      aria-required={ariaRequired}
      className={cn(componentClassName, className, ariaInvalid && 'border-destructive')}
      onChange={(event: TextareaChange) => {
        componentOnChange?.(event);
        handleChange(event);
      }}
      onBlur={(event: React.FocusEvent<HTMLTextAreaElement>) => {
        componentOnBlur?.(event);
        handleBlur(event as FocusEvt);
      }}
      onFocus={(event: React.FocusEvent<HTMLTextAreaElement>) => {
        componentOnFocus?.(event);
        handleFocus(event as FocusEvt);
      }}
    />
  );
};
