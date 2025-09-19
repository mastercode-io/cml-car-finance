'use client';

import * as React from 'react';
import { Controller, type FieldValues } from 'react-hook-form';

import { Input } from '../ui/input';
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

export const NumberField: React.FC<NumberFieldProps> = (props) => {
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
    step,
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
    min: componentMin,
    max: componentMax,
    step: componentStep,
    ...restComponentProps
  } = resolvedComponentProps;

  const mergedMin = min ?? (componentMin as number | string | undefined);
  const mergedMax = max ?? (componentMax as number | string | undefined);
  const mergedStep = step ?? (componentStep as number | string | undefined);

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

  const handleValueChange = React.useCallback(
    (event: InputChange) => {
      const nextValue = parseNumberValue(event.target.value);
      onChange?.(nextValue);
      onValueChange?.(nextValue);

      if (typeof nextValue === 'number') {
        onNumberChange?.(nextValue);
      }
    },
    [onChange, onNumberChange, onValueChange],
  );

  if (control) {
    return (
      <Controller
        name={name}
        control={control}
        rules={rules}
        defaultValue={
          typeof defaultValue === 'number'
            ? defaultValue
            : parseNumberValue(String(defaultValue ?? ''))
        }
        render={({ field, fieldState }) => (
          <Input
            {...restComponentProps}
            id={fieldId}
            type="number"
            inputMode="decimal"
            name={name}
            value={
              typeof field.value === 'number'
                ? field.value
                : (parseNumberValue(String(field.value ?? '')) ?? '')
            }
            placeholder={placeholder ?? componentPlaceholder}
            disabled={disabled ?? componentDisabled}
            readOnly={readOnly ?? componentReadOnly}
            min={mergedMin}
            max={mergedMax}
            step={mergedStep}
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
              const nextValue = parseNumberValue(event.target.value);
              field.onChange(nextValue);
              handleValueChange(event);
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

  const inputValue =
    value === undefined
      ? undefined
      : typeof value === 'number'
        ? value
        : value === null
          ? ''
          : undefined;

  const defaultInputValue =
    inputValue === undefined
      ? typeof defaultValue === 'number'
        ? defaultValue
        : (parseNumberValue(String(defaultValue ?? '')) ?? undefined)
      : undefined;

  return (
    <Input
      {...restComponentProps}
      id={fieldId}
      name={name}
      type="number"
      inputMode="decimal"
      value={inputValue ?? undefined}
      defaultValue={defaultInputValue ?? (componentDefaultValue as number | string | undefined)}
      placeholder={placeholder ?? componentPlaceholder}
      disabled={disabled ?? componentDisabled}
      readOnly={readOnly ?? componentReadOnly}
      min={mergedMin}
      max={mergedMax}
      step={mergedStep}
      aria-describedby={ariaDescribedBy}
      aria-invalid={ariaInvalid}
      aria-required={ariaRequired}
      className={cn(componentClassName, className, ariaInvalid && 'border-destructive')}
      onChange={(event: InputChange) => {
        componentOnChange?.(event);
        handleValueChange(event);
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
