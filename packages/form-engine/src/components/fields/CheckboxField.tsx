'use client';

import * as React from 'react';
import { Controller } from 'react-hook-form';

import type { FieldProps } from './types';
import { withFieldWrapper } from './withFieldWrapper';

const CheckboxComponent: React.FC<FieldProps> = ({
  name,
  control,
  rules,
  disabled,
  onChange,
  onBlur,
  defaultValue
}) => {
  if (control) {
    return (
      <Controller
        name={name}
        control={control}
        rules={rules}
        render={({ field }) => (
          <input
            {...field}
            id={name}
            type="checkbox"
            disabled={disabled}
            checked={Boolean(field.value)}
            onChange={event => {
              field.onChange(event.target.checked);
              onChange?.(event.target.checked);
            }}
            onBlur={() => {
              field.onBlur();
              onBlur?.();
            }}
          />
        )}
      />
    );
  }

  return (
    <input
      id={name}
      name={name}
      type="checkbox"
      defaultChecked={Boolean(defaultValue)}
      disabled={disabled}
      onChange={event => onChange?.(event.target.checked)}
      onBlur={onBlur}
    />
  );
};

export const CheckboxField = withFieldWrapper(CheckboxComponent);
