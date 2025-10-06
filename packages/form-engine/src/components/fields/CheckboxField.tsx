'use client';

import * as React from 'react';
import { Controller, type FieldValues } from 'react-hook-form';

import { Checkbox } from '../ui/checkbox';
import { cn } from '../../utils/cn';

import type { FieldProps } from './types';
import type { FocusEvt } from '../../types/events';

export type CheckboxFieldProps<TFieldValues extends FieldValues = FieldValues> = FieldProps<
  TFieldValues,
  boolean | null
>;

export const CheckboxField: React.FC<CheckboxFieldProps> = (props) => {
  const {
    id,
    name,
    control,
    rules,
    disabled,
    onChange,
    onValueChange,
    onCheckedChange,
    onBlur,
    onFocus,
    defaultValue,
    value,
    ariaDescribedBy,
    ariaInvalid,
    ariaRequired,
    componentProps,
    className,
    readOnly,
  } = props;

  const fieldId = id ?? name;
  const resolvedComponentProps = (componentProps ?? {}) as React.ComponentProps<typeof Checkbox>;
  const {
    className: componentClassName,
    onCheckedChange: componentOnCheckedChange,
    onBlur: componentOnBlur,
    onFocus: componentOnFocus,
    disabled: componentDisabled,
    defaultChecked: componentDefaultChecked,
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
    (nextValue: boolean | undefined) => {
      const resolved = nextValue === undefined ? false : nextValue;
      onChange?.(resolved);
      onValueChange?.(resolved);
      onCheckedChange?.(resolved);
    },
    [onChange, onCheckedChange, onValueChange],
  );

  const hasExternalValue = value !== undefined;
  const [internalValue, setInternalValue] = React.useState<boolean>(() =>
    hasExternalValue ? value === true : Boolean(defaultValue),
  );

  React.useEffect(() => {
    if (hasExternalValue) {
      setInternalValue(Boolean(value));
    }
  }, [hasExternalValue, value]);

  const isDisabled = disabled ?? componentDisabled;

  if (control) {
    return (
      <Controller
        name={name}
        control={control}
        rules={rules}
        defaultValue={ariaRequired ? undefined : Boolean(defaultValue)}
        render={({ field }) => {
          const checked = field.value === true;

          return (
            <>
              <Checkbox
                {...restComponentProps}
                id={fieldId}
                name={name}
                checked={checked}
                disabled={isDisabled}
                aria-describedby={ariaDescribedBy}
                aria-invalid={ariaInvalid}
                aria-required={ariaRequired}
                className={cn(componentClassName, className)}
                onCheckedChange={(nextState) => {
                  componentOnCheckedChange?.(nextState);
                  if (readOnly) {
                    return;
                  }

                  const nextValue = nextState === true;
                  const valueToStore = nextValue ? true : ariaRequired ? undefined : false;
                  field.onChange(valueToStore);
                  handleChange(valueToStore);
                }}
                onBlur={(event: React.FocusEvent<HTMLButtonElement>) => {
                  componentOnBlur?.(event);
                  field.onBlur();
                  handleBlur(event);
                }}
                onFocus={(event: React.FocusEvent<HTMLButtonElement>) => {
                  componentOnFocus?.(event);
                  handleFocus(event);
                }}
                ref={field.ref}
              />
              <input type="hidden" name={name} value={checked ? 'true' : 'false'} />
            </>
          );
        }}
      />
    );
  }

  const resolvedChecked = hasExternalValue ? value === true : internalValue;
  const defaultCheckedValue = componentDefaultChecked ?? Boolean(defaultValue);

  return (
    <>
      <Checkbox
        {...restComponentProps}
        id={fieldId}
        name={name}
        checked={resolvedChecked}
        defaultChecked={hasExternalValue ? undefined : defaultCheckedValue}
        disabled={isDisabled}
        aria-describedby={ariaDescribedBy}
        aria-invalid={ariaInvalid}
        aria-required={ariaRequired}
        className={cn(componentClassName, className)}
        onCheckedChange={(nextState) => {
          componentOnCheckedChange?.(nextState);
          if (readOnly) {
            return;
          }

          const nextValue = nextState === true;
          const valueToStore = nextValue ? true : ariaRequired ? undefined : false;

          if (!hasExternalValue) {
            setInternalValue(Boolean(valueToStore));
          }

          handleChange(valueToStore);
        }}
        onBlur={(event: React.FocusEvent<HTMLButtonElement>) => {
          componentOnBlur?.(event);
          handleBlur(event);
        }}
        onFocus={(event: React.FocusEvent<HTMLButtonElement>) => {
          componentOnFocus?.(event);
          handleFocus(event);
        }}
      />
      <input type="hidden" name={name} value={resolvedChecked ? 'true' : 'false'} />
    </>
  );
};
