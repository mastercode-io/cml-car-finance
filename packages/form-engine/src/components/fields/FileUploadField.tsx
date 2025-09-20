'use client';

import * as React from 'react';
import { Controller, type FieldValues } from 'react-hook-form';

import { cn } from '../../utils/cn';

import type { FieldProps } from './types';
import type { FileChange, FocusEvt } from '../../types/events';

export type FileUploadFieldProps<TFieldValues extends FieldValues = FieldValues> = FieldProps<
  TFieldValues,
  FileList | null
> & {
  accept?: string;
  multiple?: boolean;
};

const toFileList = (event: FileChange): FileList | null => event.target.files ?? null;

export const FileUploadField: React.FC<FileUploadFieldProps> = (props) => {
  const {
    id,
    name,
    control,
    rules,
    disabled,
    onChange,
    onValueChange,
    onFileSelect,
    onBlur,
    onFocus,
    className,
    ariaDescribedBy,
    ariaInvalid,
    ariaRequired,
    componentProps,
    accept,
    multiple,
  } = props;

  const fieldId = id ?? name;
  const resolvedComponentProps = (componentProps ??
    {}) as React.InputHTMLAttributes<HTMLInputElement>;

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
    (nextValue: FileList | null) => {
      onChange?.(nextValue);
      onValueChange?.(nextValue);
      onFileSelect?.(nextValue);
    },
    [onChange, onFileSelect, onValueChange],
  );

  const renderInput = (
    onFileChange: (next: FileList | null) => void,
    invalid: boolean | undefined,
  ) => (
    <input
      {...resolvedComponentProps}
      id={fieldId}
      name={name}
      type="file"
      className={cn('block w-full text-sm', className, invalid && 'border-destructive')}
      accept={accept ?? resolvedComponentProps.accept}
      multiple={multiple ?? resolvedComponentProps.multiple}
      disabled={disabled || resolvedComponentProps.disabled}
      aria-describedby={ariaDescribedBy}
      aria-invalid={invalid}
      aria-required={ariaRequired}
      onChange={(event: FileChange) => {
        const files = toFileList(event);
        onFileChange(files);
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
        defaultValue={null}
        render={({ field, fieldState }) =>
          renderInput(
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

  return renderInput((nextValue) => {
    emitValue(nextValue);
  }, ariaInvalid);
};
