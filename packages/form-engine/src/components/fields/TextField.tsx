'use client';

import * as React from 'react';
import { Controller, type FieldValues } from 'react-hook-form';

import { Input } from '../ui/input';
import { cn } from '../../utils/cn';

import type { FocusEvt, InputChange } from '../../types/events';
import type { FieldProps } from './types';

export type TextFieldProps<TFieldValues extends FieldValues = FieldValues> = FieldProps<
  TFieldValues,
  string | null
>;

export const TextField: React.FC<TextFieldProps> = (props) => {
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
  } = props;

  const fieldId = id ?? name;
  const resolvedComponentProps = (componentProps ?? {}) as React.ComponentProps<typeof Input>;
  const {
    className: componentClassName,
    onChange: componentOnChange,
    onBlur: componentOnBlur,
    onFocus: componentOnFocus,
    defaultValue: componentDefaultValue,
    placeholder: componentPlaceholder,
    disabled: componentDisabled,
    readOnly: componentReadOnly,
    ...restComponentProps
  } = resolvedComponentProps;

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
    (event: InputChange) => {
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
          <Input
            {...restComponentProps}
            id={fieldId}
            type="text"
            name={name}
            value={(field.value as string | undefined) ?? ''}
            placeholder={placeholder ?? componentPlaceholder}
            disabled={disabled ?? componentDisabled}
            readOnly={readOnly ?? componentReadOnly}
            aria-describedby={ariaDescribedBy}
            aria-invalid={ariaInvalid ?? Boolean(fieldState.error)}
            aria-required={ariaRequired}
            className={cn(
              componentClassName,
              className,
              (ariaInvalid ?? Boolean(fieldState.error)) && 'border-destructive',
            )}
            onChange={(event: InputChange) => {
              componentOnChange?.(event);
              field.onChange(event.target.value);
              handleChange(event);
            }}
            onBlur={(event: React.FocusEvent<HTMLInputElement>) => {
              componentOnBlur?.(event);
              field.onBlur();
              handleBlur(event as FocusEvt);
            }}
            onFocus={(event: React.FocusEvent<HTMLInputElement>) => {
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
    <Input
      {...restComponentProps}
      id={fieldId}
      name={name}
      type="text"
      value={inputValue ?? undefined}
      defaultValue={defaultInputValue ?? (componentDefaultValue as string | undefined)}
      placeholder={placeholder ?? componentPlaceholder}
      disabled={disabled ?? componentDisabled}
      readOnly={readOnly ?? componentReadOnly}
      aria-describedby={ariaDescribedBy}
      aria-invalid={ariaInvalid}
      aria-required={ariaRequired}
      className={cn(componentClassName, className, ariaInvalid && 'border-destructive')}
      onChange={(event: InputChange) => {
        componentOnChange?.(event);
        handleChange(event);
      }}
      onBlur={(event: React.FocusEvent<HTMLInputElement>) => {
        componentOnBlur?.(event);
        handleBlur(event as FocusEvt);
      }}
      onFocus={(event: React.FocusEvent<HTMLInputElement>) => {
        componentOnFocus?.(event);
        handleFocus(event as FocusEvt);
      }}
    />
  );
};
