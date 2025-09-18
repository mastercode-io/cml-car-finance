'use client';

import * as React from 'react';
import { Controller } from 'react-hook-form';

import { cn } from '../../utils/cn';
import type { FieldProps } from './types';
import { withFieldWrapper } from './withFieldWrapper';

interface SelectOption {
  label: string;
  value: string | number;
}

const SelectFieldComponent: React.FC<FieldProps & { options?: SelectOption[] }> = ({
  name,
  control,
  rules,
  disabled,
  onChange,
  onBlur,
  className,
  defaultValue,
  options = [],
  placeholder
}) => {
  const renderOptions = () =>
    options.map(option => (
      <option key={option.value} value={option.value}>
        {option.label}
      </option>
    ));

  if (control) {
    return (
      <Controller
        name={name}
        control={control}
        rules={rules}
        render={({ field, fieldState }) => (
          <select
            {...field}
            id={name}
            disabled={disabled}
            className={cn('block w-full rounded-md border px-3 py-2 text-sm', className, fieldState.error && 'border-red-500')}
            onChange={event => {
              field.onChange(event.target.value);
              onChange?.(event.target.value);
            }}
            onBlur={() => {
              field.onBlur();
              onBlur?.();
            }}
          >
            {placeholder ? (
              <option value="" disabled>
                {placeholder}
              </option>
            ) : null}
            {renderOptions()}
          </select>
        )}
      />
    );
  }

  return (
    <select
      id={name}
      name={name}
      defaultValue={defaultValue as string | number | undefined}
      disabled={disabled}
      className={cn('block w-full rounded-md border px-3 py-2 text-sm', className)}
      onChange={event => onChange?.(event.target.value)}
      onBlur={onBlur}
    >
      {placeholder ? <option value="">{placeholder}</option> : null}
      {renderOptions()}
    </select>
  );
};

export const SelectField = withFieldWrapper(SelectFieldComponent);
