'use client';

import * as React from 'react';
import { Controller, type FieldValues } from 'react-hook-form';

import { cn } from '../../utils/cn';

import type { FocusEvt, InputChange } from '../../types/events';
import type { FieldProps } from './types';

interface RadioOption {
  label: string;
  value: string | number;
  description?: string;
}

export type RadioGroupFieldProps<TFieldValues extends FieldValues = FieldValues> = FieldProps<
  TFieldValues,
  string | number | null
> & {
  options?: RadioOption[];
  orientation?: 'horizontal' | 'vertical';
};

const toPrimitive = (value: string | number | null | undefined): string =>
  value === null || value === undefined ? '' : String(value);

export const RadioGroupField: React.FC<RadioGroupFieldProps> = (props) => {
  const {
    id,
    name,
    control,
    rules,
    disabled,
    readOnly,
    onChange,
    onValueChange,
    onStringChange,
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
    orientation = 'vertical',
  } = props;

  const fieldId = id ?? name;
  const resolvedComponentProps = (componentProps ??
    {}) as React.InputHTMLAttributes<HTMLInputElement>;
  const hasExternalValue = value !== undefined;
  const [internalValue, setInternalValue] = React.useState<string | number | null>(() => {
    if (hasExternalValue) {
      return (value as string | number | null | undefined) ?? null;
    }

    return (defaultValue as string | number | null | undefined) ?? null;
  });

  React.useEffect(() => {
    if (hasExternalValue) {
      setInternalValue((value as string | number | null | undefined) ?? null);
    }
  }, [hasExternalValue, value]);

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
    (nextValue: string | number | null) => {
      onChange?.(nextValue);
      onValueChange?.(nextValue);

      if (typeof nextValue === 'string') {
        onStringChange?.(nextValue);
      }
    },
    [onChange, onStringChange, onValueChange],
  );

  const renderOptions = (
    selected: string | number | null,
    onSelect: (nextValue: string | number) => void,
    isDisabled: boolean,
    invalid: boolean | undefined,
    describedBy?: string,
  ) => (
    <div
      role="radiogroup"
      aria-describedby={describedBy}
      aria-invalid={invalid}
      aria-required={ariaRequired}
      className={cn('flex gap-4', orientation === 'vertical' ? 'flex-col' : 'flex-row', className)}
    >
      {options.map((option) => {
        const optionId = `${fieldId}-${toPrimitive(option.value)}`;
        const checked = toPrimitive(selected) === toPrimitive(option.value);

        return (
          <label
            key={optionId}
            htmlFor={optionId}
            className="inline-flex cursor-pointer flex-col gap-1 text-sm"
          >
            <span className="inline-flex items-center gap-2">
              <input
                {...resolvedComponentProps}
                id={optionId}
                type="radio"
                name={name}
                value={option.value}
                checked={checked}
                disabled={isDisabled || resolvedComponentProps.disabled}
                readOnly={readOnly}
                onChange={(event: InputChange) => {
                  if (event.target.checked) {
                    onSelect(option.value);
                  }
                }}
                onBlur={handleBlur}
                onFocus={handleFocus}
              />
              <span>{option.label}</span>
            </span>
            {option.description ? (
              <span className="text-xs text-muted-foreground">{option.description}</span>
            ) : null}
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
        defaultValue={
          defaultValue === undefined || defaultValue === null
            ? undefined
            : (defaultValue as string | number)
        }
        render={({ field, fieldState }) =>
          renderOptions(
            field.value as string | number | null,
            (nextValue) => {
              field.onChange(nextValue);
              handleValueChange(nextValue);
            },
            Boolean(disabled),
            ariaInvalid ?? Boolean(fieldState.error),
            ariaDescribedBy,
          )
        }
      />
    );
  }

  return renderOptions(
    hasExternalValue ? ((value as string | number | null | undefined) ?? null) : internalValue,
    (nextValue) => {
      if (!hasExternalValue) {
        setInternalValue(nextValue);
      }
      handleValueChange(nextValue);
    },
    Boolean(disabled),
    ariaInvalid,
    ariaDescribedBy,
  );
};
