'use client';

import * as React from 'react';
import { Controller, type FieldValues } from 'react-hook-form';

import { cn } from '../../../utils/cn';

import type { FocusEvt, InputChange } from '../../../types/events';
import type { FieldProps } from '../types';

export type EmailFieldProps<TFieldValues extends FieldValues = FieldValues> = FieldProps<
  TFieldValues,
  string | null
>;

export const EmailField: React.FC<EmailFieldProps> = (props) => {
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
  } = props;

  const fieldId = id ?? name;
  const resolvedComponentProps = (componentProps ??
    {}) as React.InputHTMLAttributes<HTMLInputElement>;
  const hasExternalValue = value !== undefined;

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
    (nextValue: string) => {
      onChange?.(nextValue);
      onValueChange?.(nextValue);
      onStringChange?.(nextValue);
    },
    [onChange, onStringChange, onValueChange],
  );

  const renderInput = (
    currentValue: string,
    onValueUpdate: (next: string) => void,
    invalid: boolean | undefined,
  ) => (
    <input
      {...resolvedComponentProps}
      id={fieldId}
      name={name}
      type="email"
      inputMode="email"
      autoComplete={resolvedComponentProps.autoComplete ?? 'email'}
      value={currentValue}
      placeholder={placeholder ?? resolvedComponentProps.placeholder}
      disabled={disabled || resolvedComponentProps.disabled}
      readOnly={readOnly}
      aria-describedby={ariaDescribedBy}
      aria-invalid={invalid}
      aria-required={ariaRequired}
      className={cn(
        'block w-full rounded-md border px-3 py-2 text-sm',
        className,
        invalid && 'border-destructive',
      )}
      onChange={(event: InputChange) => {
        const next = event.target.value;
        onValueUpdate(next);
      }}
      onBlur={handleBlur}
      onFocus={handleFocus}
    />
  );

  const initialValue = hasExternalValue
    ? ((value as string | null | undefined) ?? '')
    : ((defaultValue as string | null | undefined) ?? '');
  const [internalValue, setInternalValue] = React.useState<string>(initialValue);

  React.useEffect(() => {
    if (hasExternalValue) {
      setInternalValue((value as string | null | undefined) ?? '');
    }
  }, [hasExternalValue, value]);

  if (control) {
    return (
      <Controller
        name={name}
        control={control}
        rules={rules}
        defaultValue={(defaultValue as string | undefined) ?? ''}
        render={({ field, fieldState }) =>
          renderInput(
            (field.value as string | undefined) ?? '',
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
    hasExternalValue ? ((value as string | null | undefined) ?? '') : internalValue,
    (nextValue) => {
      if (!hasExternalValue) {
        setInternalValue(nextValue);
      }
      emitValue(nextValue);
    },
    ariaInvalid,
  );
};
