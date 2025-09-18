import type { Control, FieldValues, RegisterOptions } from 'react-hook-form';

import type {
  FieldValue,
  FocusEvt,
  OnCheckedChange,
  OnDateSelect,
  OnFileSelect,
  OnNumberChange,
  OnSliderChange,
  OnStringChange
} from '../../types/events';

export interface FieldError {
  type: string;
  message: string;
}

export interface FieldProps<
  TFieldValues extends FieldValues = FieldValues,
  TValue = FieldValue
> {
  id?: string;
  name: string;
  label?: string;
  value?: TValue;
  defaultValue?: TValue;
  placeholder?: string;
  description?: string;
  helpText?: string;
  error?: string | FieldError;
  disabled?: boolean;
  readOnly?: boolean;
  required?: boolean;
  wrapperClassName?: string;
  className?: string;
  control?: Control<TFieldValues>;
  rules?: RegisterOptions<TFieldValues>;
  ariaDescribedBy?: string;
  ariaInvalid?: boolean;
  ariaRequired?: boolean;
  componentProps?: Record<string, unknown>;
  onChange?: (value: TValue) => void;
  onValueChange?: (value: TValue) => void;
  onStringChange?: OnStringChange;
  onNumberChange?: OnNumberChange;
  onCheckedChange?: OnCheckedChange;
  onSliderChange?: OnSliderChange;
  onDateSelect?: OnDateSelect;
  onFileSelect?: OnFileSelect;
  onBlur?: (event: FocusEvt) => void;
  onFocus?: (event: FocusEvt) => void;
  [key: string]: unknown;
}
