'use client';

import * as React from 'react';
import { Controller, type FieldValues } from 'react-hook-form';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { cn } from '../../utils/cn';

import type { FocusEvt } from '../../types/events';
import type { FieldProps } from './types';

interface SelectOption {
  label: string;
  value: string | number;
}

export type SelectFieldProps<TFieldValues extends FieldValues = FieldValues> = FieldProps<
  TFieldValues,
  string | number | null
> & {
  options?: SelectOption[];
  placeholder?: string;
};

const getOptionValue = (value: string, options: SelectOption[]): string | number => {
  const matched = options.find((option) => String(option.value) === value);
  return matched ? matched.value : value;
};

type SelectComponentProps = React.ComponentProps<typeof Select> & {
  triggerProps?: React.ComponentPropsWithoutRef<typeof SelectTrigger>;
  contentProps?: React.ComponentPropsWithoutRef<typeof SelectContent>;
  className?: string;
  onBlur?: React.FocusEventHandler<HTMLButtonElement>;
  onFocus?: React.FocusEventHandler<HTMLButtonElement>;
  onChange?: (event: React.ChangeEvent<HTMLSelectElement>) => void;
};

export const SelectField: React.FC<SelectFieldProps> = (props) => {
  const {
    id,
    name,
    control,
    rules,
    disabled,
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
    options = [],
    placeholder,
    readOnly,
  } = props;

  const fieldId = id ?? name;
  const resolvedComponentProps = (componentProps ?? {}) as SelectComponentProps;
  const {
    triggerProps,
    contentProps,
    onValueChange: componentOnValueChange,
    disabled: componentDisabled,
    value: componentValue,
    defaultValue: componentDefaultValue,
    className: selectClassName,
    onBlur: legacyOnBlur,
    onFocus: legacyOnFocus,
    onChange: legacyOnChange,
    ...restSelectProps
  } = resolvedComponentProps;
  const {
    className: triggerClassName,
    onBlur: triggerOnBlur,
    onFocus: triggerOnFocus,
    disabled: triggerDisabled,
    ...restTriggerProps
  } = triggerProps ?? {};
  const mergedTriggerOnBlur =
    triggerOnBlur ?? (legacyOnBlur as React.FocusEventHandler<HTMLButtonElement> | undefined);
  const mergedTriggerOnFocus =
    triggerOnFocus ?? (legacyOnFocus as React.FocusEventHandler<HTMLButtonElement> | undefined);
  const { className: contentClassName, ...restContentProps } = contentProps ?? {};

  const hasExternalValue = value !== undefined;
  const [internalValue, setInternalValue] = React.useState<string | number | null>(() => {
    if (hasExternalValue) {
      return (value as string | number | null | undefined) ?? null;
    }

    if (defaultValue !== null && defaultValue !== undefined) {
      return defaultValue as string | number;
    }

    if (componentValue !== undefined && componentValue !== null) {
      return getOptionValue(String(componentValue), options);
    }

    if (componentDefaultValue !== undefined && componentDefaultValue !== null) {
      return getOptionValue(String(componentDefaultValue), options);
    }

    return null;
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

  const emitValueChange = React.useCallback(
    (nextValue: string | number | null) => {
      onChange?.(nextValue);
      onValueChange?.(nextValue);
    },
    [onChange, onValueChange],
  );

  const renderOptions = () =>
    options.map((option) => (
      <SelectItem key={option.value} value={String(option.value)}>
        {option.label}
      </SelectItem>
    ));

  const isReadOnly = Boolean(readOnly);
  const isDisabled = Boolean(disabled ?? componentDisabled ?? triggerDisabled);

  const renderSelect = (
    selectedValue: string | number | null | undefined,
    onSelected: (next: string | number | null) => void,
    invalid: boolean | undefined,
    describedBy?: string,
    onBlurCallback?: () => void,
  ) => {
    const primitiveValue =
      selectedValue === null || selectedValue === undefined ? undefined : String(selectedValue);

    return (
      <>
        <Select
          {...restSelectProps}
          value={primitiveValue}
          onValueChange={(next: string) => {
            componentOnValueChange?.(next);
            legacyOnChange?.({ target: { value: next } } as React.ChangeEvent<HTMLSelectElement>);
            if (isReadOnly) {
              return;
            }

            const parsedValue = getOptionValue(next, options);
            onSelected(parsedValue);
            emitValueChange(parsedValue);
          }}
          disabled={isDisabled || isReadOnly}
        >
          <SelectTrigger
            {...restTriggerProps}
            id={fieldId}
            aria-describedby={describedBy}
            aria-invalid={invalid}
            aria-required={ariaRequired}
            className={cn(
              selectClassName,
              triggerClassName,
              className,
              invalid && 'border-destructive',
            )}
            disabled={isDisabled || isReadOnly}
            onBlur={(event: React.FocusEvent<HTMLButtonElement>) => {
              mergedTriggerOnBlur?.(event);
              onBlurCallback?.();
              handleBlur(event as FocusEvt);
            }}
            onFocus={(event: React.FocusEvent<HTMLButtonElement>) => {
              mergedTriggerOnFocus?.(event);
              handleFocus(event as FocusEvt);
            }}
          >
            <SelectValue placeholder={placeholder} />
          </SelectTrigger>
          <SelectContent {...restContentProps} className={cn(contentClassName)}>
            {renderOptions()}
          </SelectContent>
        </Select>
        <input type="hidden" name={name} value={primitiveValue ?? ''} />
      </>
    );
  };

  if (control) {
    return (
      <Controller
        name={name}
        control={control}
        rules={rules}
        defaultValue={
          defaultValue === null || defaultValue === undefined
            ? undefined
            : (defaultValue as string | number)
        }
        render={({ field, fieldState }) =>
          renderSelect(
            field.value as string | number | null,
            (nextValue) => {
              field.onChange(nextValue);
              if (!hasExternalValue) {
                setInternalValue(nextValue);
              }
            },
            ariaInvalid ?? Boolean(fieldState.error),
            ariaDescribedBy,
            () => field.onBlur(),
          )
        }
      />
    );
  }

  const currentValue = hasExternalValue
    ? ((value as string | number | null | undefined) ?? null)
    : internalValue;

  return renderSelect(
    currentValue,
    (nextValue) => {
      if (!hasExternalValue) {
        setInternalValue(nextValue);
      }
    },
    ariaInvalid,
    ariaDescribedBy,
  );
};
