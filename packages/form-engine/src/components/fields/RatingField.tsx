'use client';

import * as React from 'react';
import { Controller, type FieldValues } from 'react-hook-form';

import { cn } from '../../utils/cn';

import type { FocusEvt, InputChange } from '../../types/events';
import type { FieldProps } from './types';

export type RatingFieldProps<TFieldValues extends FieldValues = FieldValues> = FieldProps<
  TFieldValues,
  number | null
> & {
  maxRating?: number;
  icon?: React.ReactNode;
};

const parseRatingValue = (value: string | number | null | undefined): number | null => {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isNaN(parsed) ? null : parsed;
};

const DefaultIcon: React.FC<{ filled: boolean }> = ({ filled }) => (
  <span aria-hidden="true" className={filled ? 'text-primary' : 'text-muted-foreground'}>
    ★
  </span>
);

export const RatingField: React.FC<RatingFieldProps> = (props) => {
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
    maxRating = 5,
    icon,
  } = props;

  const fieldId = id ?? name;
  const resolvedComponentProps = (componentProps ??
    {}) as React.InputHTMLAttributes<HTMLInputElement>;
  const hasExternalValue = value !== undefined;
  const [internalValue, setInternalValue] = React.useState<number | null>(() =>
    hasExternalValue ? parseRatingValue(value) : parseRatingValue(defaultValue),
  );
  const IconComponent: React.ComponentType<{ filled: boolean }> = icon
    ? ({ filled }) => (
        <span className={filled ? 'text-primary' : 'text-muted-foreground'}>{icon}</span>
      )
    : DefaultIcon;

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
      setInternalValue(parseRatingValue(value));
    }
  }, [hasExternalValue, value]);

  const renderRating = (
    currentValue: number | null,
    onValueUpdate: (next: number | null) => void,
    invalid: boolean | undefined,
  ) => (
    <div
      className={cn('inline-flex items-center gap-2', className)}
      role="radiogroup"
      aria-required={ariaRequired}
      aria-invalid={invalid}
      aria-describedby={ariaDescribedBy}
    >
      {Array.from({ length: Math.max(maxRating, 1) }, (_, index) => {
        const ratingValue = index + 1;
        const optionId = `${fieldId}-${ratingValue}`;
        const isFilled = currentValue !== null && currentValue >= ratingValue;

        return (
          <label key={optionId} htmlFor={optionId} className="cursor-pointer">
            <span className="sr-only">{ratingValue}</span>
            <input
              {...resolvedComponentProps}
              id={optionId}
              type="radio"
              name={name}
              value={ratingValue}
              className="sr-only"
              checked={currentValue === ratingValue}
              disabled={disabled || resolvedComponentProps.disabled}
              readOnly={readOnly}
              onChange={(event: InputChange) => {
                if (event.target.checked) {
                  onValueUpdate(ratingValue);
                }
              }}
              onBlur={handleBlur}
              onFocus={handleFocus}
            />
            <IconComponent filled={isFilled} />
          </label>
        );
      })}
    </div>
  );

  if (control) {
    return (
      <Controller
        name={name}
        control={control}
        rules={rules}
        defaultValue={parseRatingValue(defaultValue)}
        render={({ field, fieldState }) =>
          renderRating(
            parseRatingValue(field.value),
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

  return renderRating(
    hasExternalValue ? parseRatingValue(value) : internalValue,
    (nextValue) => {
      if (!hasExternalValue) {
        setInternalValue(nextValue);
      }
      emitValue(nextValue);
    },
    ariaInvalid,
  );
};
