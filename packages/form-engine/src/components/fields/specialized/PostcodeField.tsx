'use client';

import * as React from 'react';
import { Controller, type FieldValues } from 'react-hook-form';

import { cn } from '../../../utils/cn';
import type { FocusEvt, InputChange } from '../../../types/events';
import type { FieldProps } from '../types';

export type PostcodeFieldProps<TFieldValues extends FieldValues = FieldValues> = FieldProps<
  TFieldValues,
  string | null
> & {
  autoFormat?: boolean;
};

type PostcodeComponentProps = React.InputHTMLAttributes<HTMLInputElement> & {
  autoFormat?: boolean;
};

const POSTCODE_PATTERN = '^[A-Za-z]{1,2}\\d[A-Za-z\\d]? ?\\d[A-Za-z]{2}$';

const normalizePostcode = (value: string): string =>
  value
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, 7);

const formatPostcode = (value: string, autoFormat: boolean): string => {
  const normalized = normalizePostcode(value);
  if (!normalized) {
    return '';
  }

  if (!autoFormat || normalized.length <= 3) {
    return normalized;
  }

  return `${normalized.slice(0, normalized.length - 3)} ${normalized.slice(-3)}`;
};

export const PostcodeField: React.FC<PostcodeFieldProps> = (props) => {
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
    autoFormat,
  } = props;

  const fieldId = id ?? name;
  const { autoFormat: componentAutoFormat, ...restComponentProps } = (componentProps ??
    {}) as PostcodeComponentProps;

  const shouldAutoFormat =
    typeof autoFormat === 'boolean'
      ? autoFormat
      : typeof componentAutoFormat === 'boolean'
        ? componentAutoFormat
        : true;

  const resolvedComponentProps = restComponentProps;
  const hasExternalValue = value !== undefined;

  const emitValue = React.useCallback(
    (nextValue: string) => {
      onChange?.(nextValue);
      onValueChange?.(nextValue);
      onStringChange?.(nextValue);
    },
    [onChange, onStringChange, onValueChange],
  );

  const initialValue = hasExternalValue
    ? ((value as string | null | undefined) ?? '')
    : ((defaultValue as string | null | undefined) ?? '');

  const formattedInitial = React.useMemo(
    () => formatPostcode(initialValue, shouldAutoFormat),
    [initialValue, shouldAutoFormat],
  );

  const [internalValue, setInternalValue] = React.useState<string>(formattedInitial);

  React.useEffect(() => {
    if (hasExternalValue) {
      setInternalValue(
        formatPostcode((value as string | null | undefined) ?? '', shouldAutoFormat),
      );
    }
  }, [hasExternalValue, shouldAutoFormat, value]);

  React.useEffect(() => {
    if (!hasExternalValue) {
      setInternalValue(formatPostcode(initialValue, shouldAutoFormat));
    }
  }, [hasExternalValue, initialValue, shouldAutoFormat]);

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

  const renderInput = (
    currentValue: string,
    onValueUpdate: (next: string) => void,
    invalid: boolean | undefined,
  ) => (
    <input
      {...resolvedComponentProps}
      id={fieldId}
      name={name}
      type="text"
      inputMode={resolvedComponentProps.inputMode ?? 'text'}
      autoComplete={resolvedComponentProps.autoComplete ?? 'postal-code'}
      maxLength={resolvedComponentProps.maxLength ?? 8}
      pattern={resolvedComponentProps.pattern ?? POSTCODE_PATTERN}
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
        const next = formatPostcode(event.target.value, shouldAutoFormat);
        onValueUpdate(next);
      }}
      onBlur={handleBlur}
      onFocus={handleFocus}
    />
  );

  if (control) {
    return (
      <Controller
        name={name}
        control={control}
        rules={rules}
        defaultValue={formattedInitial}
        render={({ field, fieldState }) => {
          const fieldValue = typeof field.value === 'string' ? field.value : '';
          const nextValue = formatPostcode(fieldValue, shouldAutoFormat);
          return renderInput(
            nextValue,
            (updatedValue) => {
              field.onChange(updatedValue);
              emitValue(updatedValue);
            },
            ariaInvalid ?? Boolean(fieldState.error),
          );
        }}
      />
    );
  }

  return renderInput(
    hasExternalValue
      ? formatPostcode((value as string | null | undefined) ?? '', shouldAutoFormat)
      : internalValue,
    (nextValue) => {
      if (!hasExternalValue) {
        setInternalValue(nextValue);
      }
      emitValue(nextValue);
    },
    ariaInvalid,
  );
};
