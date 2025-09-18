'use client';

import * as React from 'react';
import { Controller, type FieldValues } from 'react-hook-form';

import type { FieldProps } from './types';
import type { FocusEvt } from '../../types/events';

export type CheckboxFieldProps<TFieldValues extends FieldValues = FieldValues> = FieldProps<
  TFieldValues,
  boolean | null
>;

export const CheckboxField: React.FC<CheckboxFieldProps> = props => {
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
    componentProps
  } = props;

  const fieldId = id ?? name;
  const resolvedComponentProps = (componentProps ?? {}) as React.InputHTMLAttributes<HTMLInputElement>;

  const handleBlur = React.useCallback(
    (event: FocusEvt) => {
      onBlur?.(event);
    },
    [onBlur]
  );

  const handleFocus = React.useCallback(
    (event: FocusEvt) => {
      onFocus?.(event);
    },
    [onFocus]
  );

  const handleChange = (nextValue: boolean) => {
    onChange?.(nextValue);
    onValueChange?.(nextValue);
    onCheckedChange?.(nextValue);
  };

  if (control) {
    return (
      <Controller
        name={name}
        control={control}
        rules={rules}
        defaultValue={Boolean(defaultValue)}
        render={({ field }) => (
          <input
            {...resolvedComponentProps}
            {...field}
            id={fieldId}
            type="checkbox"
            disabled={disabled}
            checked={Boolean(field.value)}
            aria-describedby={ariaDescribedBy}
            aria-invalid={ariaInvalid}
            aria-required={ariaRequired}
            onChange={event => {
              field.onChange(event.target.checked);
              handleChange(event.target.checked);
            }}
            onBlur={(event: FocusEvt) => {
              field.onBlur();
              handleBlur(event);
            }}
            onFocus={handleFocus}
          />
        )}
      />
    );
  }

  const checkedValue = typeof value === 'boolean' ? value : undefined;
  const defaultCheckedValue = checkedValue === undefined ? Boolean(defaultValue) : undefined;

  return (
    <input
      {...resolvedComponentProps}
      id={fieldId}
      name={name}
      type="checkbox"
      disabled={disabled}
      checked={checkedValue}
      defaultChecked={defaultCheckedValue}
      aria-describedby={ariaDescribedBy}
      aria-invalid={ariaInvalid}
      aria-required={ariaRequired}
      onChange={event => handleChange(event.target.checked)}
      onBlur={handleBlur}
      onFocus={handleFocus}
    />
  );
};
