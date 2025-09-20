'use client';

import * as React from 'react';
import { Controller, type FieldValues } from 'react-hook-form';

import { cn } from '../../utils/cn';

import type { FocusEvt, InputChange } from '../../types/events';
import type { FieldProps } from './types';

export type SliderFieldProps<TFieldValues extends FieldValues = FieldValues> = FieldProps<
  TFieldValues,
  number | null
> & {
  min?: number;
  max?: number;
  step?: number;
  showValue?: boolean;
};

const parseSliderValue = (value: string): number | null => {
  if (value === '') {
    return null;
  }

  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
};

const coerceSliderInput = (input: unknown): number | null => {
  if (typeof input === 'number') {
    return Number.isNaN(input) ? null : input;
  }

  if (input === null || input === undefined) {
    return null;
  }

  return parseSliderValue(String(input));
};

export const SliderField: React.FC<SliderFieldProps> = (props) => {
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
    onSliderChange,
    onBlur,
    onFocus,
    className,
    defaultValue,
    value,
    ariaDescribedBy,
    ariaInvalid,
    componentProps,
    min = 0,
    max = 100,
    step = 1,
    showValue = true,
  } = props;

  const fieldId = id ?? name;
  const resolvedComponentProps = (componentProps ??
    {}) as React.InputHTMLAttributes<HTMLInputElement>;
  const hasExternalValue = value !== undefined;
  const [internalValue, setInternalValue] = React.useState<number | null>(() =>
    hasExternalValue ? coerceSliderInput(value) : coerceSliderInput(defaultValue),
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
        onSliderChange?.([nextValue]);
      }
    },
    [onChange, onNumberChange, onSliderChange, onValueChange],
  );

  React.useEffect(() => {
    if (hasExternalValue) {
      setInternalValue(coerceSliderInput(value));
    }
  }, [hasExternalValue, value]);

  const renderSlider = (
    currentValue: number | null,
    onValueUpdate: (next: number | null) => void,
    invalid: boolean | undefined,
  ) => (
    <div className={cn('flex w-full items-center gap-3', className)}>
      <input
        {...resolvedComponentProps}
        id={fieldId}
        name={name}
        type="range"
        min={min}
        max={max}
        step={step}
        value={currentValue ?? ''}
        disabled={disabled || resolvedComponentProps.disabled}
        readOnly={readOnly}
        aria-describedby={ariaDescribedBy}
        aria-invalid={invalid}
        onChange={(event: InputChange) => {
          const next = parseSliderValue(event.target.value);
          onValueUpdate(next);
        }}
        onBlur={handleBlur}
        onFocus={handleFocus}
      />
      {showValue ? (
        <output htmlFor={fieldId} aria-live="polite" className="text-sm text-muted-foreground">
          {currentValue ?? '—'}
        </output>
      ) : null}
    </div>
  );

  if (control) {
    return (
      <Controller
        name={name}
        control={control}
        rules={rules}
        defaultValue={coerceSliderInput(defaultValue)}
        render={({ field, fieldState }) =>
          renderSlider(
            coerceSliderInput(field.value),
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

  return renderSlider(
    hasExternalValue ? coerceSliderInput(value) : internalValue,
    (nextValue) => {
      if (!hasExternalValue) {
        setInternalValue(nextValue);
      }
      emitValue(nextValue);
    },
    ariaInvalid,
  );
};
