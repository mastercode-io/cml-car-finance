'use client';

import * as React from 'react';
import { Controller, type FieldValues } from 'react-hook-form';

import { Input } from '../ui/input';
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

export const DateField: React.FC<DateFieldProps> = (props) => {
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
    placeholder,
    defaultValue,
    value,
    ariaDescribedBy,
    ariaInvalid,
    ariaRequired,
    componentProps,
    min,
    max,
  } = props;

  const fieldId = id ?? name;
  const resolvedComponentProps = (componentProps ?? {}) as React.ComponentProps<typeof Input>;
  const {
    className: componentClassName,
    onChange: componentOnChange,
    onBlur: componentOnBlur,
    onFocus: componentOnFocus,
    defaultValue: componentDefaultValue,
    disabled: componentDisabled,
    readOnly: componentReadOnly,
    min: componentMin,
    max: componentMax,
    placeholder: componentPlaceholder,
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
      onDateSelect?.(toDate(nextValue));
    },
    [onChange, onDateSelect, onValueChange],
  );

  const minValue = normalizeDateBoundary(min ?? (componentMin as string | Date | undefined));
  const maxValue = normalizeDateBoundary(max ?? (componentMax as string | Date | undefined));

  if (control) {
    return (
      <Controller
        name={name}
        control={control}
        rules={rules}
        defaultValue={toInputValue(defaultValue)}
        render={({ field, fieldState }) => (
          <Input
            {...restComponentProps}
            id={fieldId}
            type="date"
            name={name}
            disabled={disabled ?? componentDisabled}
            readOnly={readOnly ?? componentReadOnly}
            value={toInputValue(field.value)}
            min={minValue}
            max={maxValue}
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
            placeholder={placeholder ?? componentPlaceholder}
            ref={field.ref}
          />
        )}
      />
    );
  }

  const inputValue = value !== undefined ? toInputValue(value) : undefined;
  const defaultInputValue = inputValue === undefined ? toInputValue(defaultValue) : undefined;

  return (
    <Input
      {...restComponentProps}
      id={fieldId}
      name={name}
      type="date"
      disabled={disabled ?? componentDisabled}
      readOnly={readOnly ?? componentReadOnly}
      value={inputValue ?? undefined}
      defaultValue={defaultInputValue ?? (componentDefaultValue as string | undefined)}
      placeholder={placeholder ?? componentPlaceholder}
      min={minValue}
      max={maxValue}
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
