'use client';

import * as React from 'react';
import { Controller, type FieldValues } from 'react-hook-form';

import { cn } from '../../../utils/cn';

import type { FocusEvt, InputChange } from '../../../types/events';
import type { FieldProps } from '../types';

export type CurrencyFieldProps<TFieldValues extends FieldValues = FieldValues> = FieldProps<
  TFieldValues,
  number | null
> & {
  currency?: string;
  locale?: string;
  prefix?: string;
  min?: number;
  max?: number;
  step?: number;
};

const parseCurrencyValue = (value: string | number | null | undefined): number | null => {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value === 'number') {
    return Number.isNaN(value) ? null : value;
  }

  const normalized = value.replace(/[^0-9.,-]/g, '').replace(/,/g, '');
  if (normalized === '') {
    return null;
  }

  const parsed = Number(normalized);
  return Number.isNaN(parsed) ? null : parsed;
};

const getCurrencyPrefix = (currency?: string, locale?: string): string | undefined => {
  if (!currency) {
    return undefined;
  }

  try {
    const parts = new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      currencyDisplay: 'narrowSymbol',
    }).formatToParts(0);

    const symbol = parts.find((part) => part.type === 'currency');
    return symbol?.value ?? currency;
  } catch (error) {
    console.warn('Failed to resolve currency symbol', error);
    return currency;
  }
};

export const CurrencyField: React.FC<CurrencyFieldProps> = (props) => {
  const {
    id,
    name,
    control,
    rules,
    disabled,
    readOnly,
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
    currency,
    locale,
    prefix,
    min,
    max,
    step = 0.01,
  } = props;

  const fieldId = id ?? name;
  const resolvedComponentProps = (componentProps ??
    {}) as React.InputHTMLAttributes<HTMLInputElement>;
  const { className: componentClassName, ...inputProps } = resolvedComponentProps;
  const resolvedPrefix = prefix ?? getCurrencyPrefix(currency, locale);
  const hasExternalValue = value !== undefined;
  const [internalValue, setInternalValue] = React.useState<number | null>(() =>
    hasExternalValue ? parseCurrencyValue(value) : parseCurrencyValue(defaultValue),
  );

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

  const emitValue = React.useCallback(
    (nextValue: number | null) => {
      onChange?.(nextValue);
      onValueChange?.(nextValue);

      if (typeof nextValue === 'number') {
        onNumberChange?.(nextValue);
      }
    },
    [onChange, onNumberChange, onValueChange],
  );

  React.useEffect(() => {
    if (hasExternalValue) {
      setInternalValue(parseCurrencyValue(value));
    }
  }, [hasExternalValue, value]);

  const renderInput = (
    currentValue: number | null,
    onValueUpdate: (next: number | null) => void,
    invalid: boolean | undefined,
  ) => (
    <div className={cn('flex items-center gap-2', className)}>
      {resolvedPrefix ? (
        <span className="text-sm text-muted-foreground" aria-hidden="true">
          {resolvedPrefix}
        </span>
      ) : null}
      <input
        {...inputProps}
        id={fieldId}
        name={name}
        type="number"
        inputMode="decimal"
        min={min ?? inputProps.min}
        max={max ?? inputProps.max}
        step={step ?? inputProps.step}
        value={currentValue ?? ''}
        disabled={disabled || inputProps.disabled}
        readOnly={readOnly}
        aria-describedby={ariaDescribedBy}
        aria-invalid={invalid}
        aria-required={ariaRequired}
        className={cn(
          'block w-full rounded-md border px-3 py-2 text-sm',
          componentClassName,
          invalid && 'border-destructive',
        )}
        onChange={(event: InputChange) => {
          const nextValue = parseCurrencyValue(event.target.value);
          onValueUpdate(nextValue);
        }}
        onBlur={handleBlur}
        onFocus={handleFocus}
      />
    </div>
  );

  if (control) {
    return (
      <Controller
        name={name}
        control={control}
        rules={rules}
        defaultValue={parseCurrencyValue(defaultValue)}
        render={({ field, fieldState }) =>
          renderInput(
            parseCurrencyValue(field.value),
            (nextValue) => {
              field.onChange(nextValue);
              emitValue(nextValue);
            },
            ariaInvalid ?? Boolean(fieldState.error),
          )
        }
      />
    );
  }

  return renderInput(
    hasExternalValue ? parseCurrencyValue(value) : internalValue,
    (nextValue) => {
      if (!hasExternalValue) {
        setInternalValue(nextValue);
      }
      emitValue(nextValue);
    },
    ariaInvalid,
  );
};
