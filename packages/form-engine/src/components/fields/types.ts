import type { Control, FieldValues, RegisterOptions } from 'react-hook-form';

export interface FieldError {
  type: string;
  message: string;
}

export interface FieldProps<TFieldValues extends FieldValues = FieldValues> {
  name: string;
  label?: string;
  value?: unknown;
  defaultValue?: unknown;
  placeholder?: string;
  description?: string;
  helpText?: string;
  error?: string | FieldError;
  disabled?: boolean;
  readOnly?: boolean;
  required?: boolean;
  className?: string;
  onChange?: (value: unknown) => void;
  onBlur?: () => void;
  onFocus?: () => void;
  control?: Control<TFieldValues>;
  rules?: RegisterOptions<TFieldValues>;
  [key: string]: unknown;
}
