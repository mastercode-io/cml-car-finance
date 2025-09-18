# Step 3: Field Registry & Base Components (Revised)

## Step Description
Build the field registry system and create ALL base field components with proper shadcn/ui integration and TypeScript typing. This step establishes the complete component library that will render form fields based on schema definitions, ensuring consistent behavior, styling, and accessibility across all form instances.

## Prerequisites
- Step 2 (Schema Foundation) completed
- shadcn/ui components installed and configured
- React Hook Form configured
- Tailwind CSS set up
- TypeScript interfaces defined with strict mode enabled

## Current Status & Gaps
- ✅ Field Registry core implemented
- ✅ Basic structure for 6 components (Text, Number, TextArea, Select, Checkbox, Date)
- ❌ Missing 9+ required widget types
- ❌ Components using raw HTML instead of shadcn/ui
- ❌ TypeScript implicit any errors throughout
- ❌ Accessibility features not implemented
- ❌ Component tests missing

## Detailed To-Do List

### 3.1 Fix TypeScript Type Errors
```typescript
// src/types/events.ts - CREATE THIS FILE FIRST

import * as React from "react";
import type { CheckedState } from "@radix-ui/react-checkbox";

export type InputChange = React.ChangeEvent<HTMLInputElement>;
export type TextareaChange = React.ChangeEvent<HTMLTextAreaElement>;
export type SelectChange = React.ChangeEvent<HTMLSelectElement>;
export type FocusEvt = React.FocusEvent<HTMLElement>;
export type FileChange = React.ChangeEvent<HTMLInputElement>;

export type OnCheckedChange = (value: CheckedState) => void;
export type OnStringChange = (value: string) => void;
export type OnNumberChange = (value: number) => void;
export type OnSliderChange = (value: number[]) => void;
export type OnDateSelect = (date: Date | undefined) => void;
export type OnFileSelect = (files: FileList | null) => void;
export type DatePredicate = (date: Date) => boolean;

// Add form-specific types
export type FieldValue = string | number | boolean | Date | File | FileList | null | undefined;
export type FieldValidator = (value: FieldValue) => boolean | string;
export type FieldFormatter = (value: FieldValue) => string;
export type FieldParser = (value: string) => FieldValue;
```

### 3.2 Update Base Field Interface with Proper Types
```typescript
// src/components/fields/types.ts - UPDATE EXISTING

import type { Control, RegisterOptions, FieldError as RHFError } from 'react-hook-form';
import type { FieldValue } from '@/types/events';

export interface FieldProps {
  name: string;
  label?: string;
  value?: FieldValue;
  defaultValue?: FieldValue;
  placeholder?: string;
  description?: string;
  helpText?: string;
  error?: string | FieldError;
  disabled?: boolean;
  readOnly?: boolean;
  required?: boolean;
  className?: string;
  onChange?: (value: FieldValue) => void;
  onBlur?: () => void;
  onFocus?: () => void;
  control?: Control<any>;
  rules?: RegisterOptions;
  // Accessibility props
  ariaLabel?: string;
  ariaDescribedBy?: string;
  ariaInvalid?: boolean;
}

export interface FieldError {
  type: string;
  message: string;
}

// Enhanced wrapper with accessibility
export function withFieldWrapper<P extends FieldProps>(
  Component: React.ComponentType<P>
): React.ComponentType<P> {
  return function WrappedField(props: P) {
    const { label, error, description, helpText, required, className, name } = props;
    const errorId = `${name}-error`;
    const descriptionId = `${name}-description`;
    const helpId = `${name}-help`;
    
    return (
      <div className={cn('space-y-2', className)}>
        {label && (
          <Label htmlFor={name} className="text-sm font-medium">
            {label}
            {required && <span className="text-red-500 ml-1" aria-label="required">*</span>}
          </Label>
        )}
        {description && (
          <p id={descriptionId} className="text-sm text-muted-foreground">
            {description}
          </p>
        )}
        <Component 
          {...props}
          ariaDescribedBy={cn(
            description && descriptionId,
            helpText && helpId,
            error && errorId
          )}
          ariaInvalid={!!error}
        />
        {helpText && (
          <p id={helpId} className="text-xs text-muted-foreground">
            {helpText}
          </p>
        )}
        {error && (
          <p id={errorId} className="text-sm text-red-500" role="alert">
            {typeof error === 'string' ? error : error.message}
          </p>
        )}
      </div>
    );
  };
}
```

### 3.3 Update ALL Existing Components to Use shadcn/ui
```typescript
// src/components/fields/TextField.tsx - UPDATE TO USE SHADCN

import { Input } from '@/components/ui/input';
import { Controller } from 'react-hook-form';
import type { InputChange, OnStringChange } from '@/types/events';
import type { FieldProps } from './types';

export const TextField: React.FC<FieldProps> = ({
  name,
  control,
  rules,
  disabled,
  readOnly,
  placeholder,
  onChange,
  onBlur,
  ariaDescribedBy,
  ariaInvalid,
  ...props
}) => {
  const handleChange = (e: InputChange): void => {
    const value = e.target.value;
    onChange?.(value);
  };

  if (control) {
    return (
      <Controller
        name={name}
        control={control}
        rules={rules}
        render={({ field, fieldState }) => (
          <Input
            {...field}
            id={name}
            type="text"
            placeholder={placeholder}
            disabled={disabled}
            readOnly={readOnly}
            aria-describedby={ariaDescribedBy}
            aria-invalid={ariaInvalid || !!fieldState.error}
            className={cn(
              fieldState.error && 'border-red-500',
              props.className
            )}
            onChange={(e: InputChange) => {
              field.onChange(e.target.value);
              handleChange(e);
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
    <Input
      id={name}
      name={name}
      type="text"
      defaultValue={props.defaultValue as string}
      placeholder={placeholder}
      disabled={disabled}
      readOnly={readOnly}
      aria-describedby={ariaDescribedBy}
      aria-invalid={ariaInvalid}
      className={props.className}
      onChange={handleChange}
      onBlur={onBlur}
    />
  );
};
```

### 3.4 Implement Missing Required Components

#### RadioGroup Field
```typescript
// src/components/fields/RadioGroupField.tsx - NEW

import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Controller } from 'react-hook-form';
import type { OnStringChange } from '@/types/events';
import type { FieldProps } from './types';

export interface RadioGroupFieldProps extends FieldProps {
  options: Array<{ label: string; value: string; disabled?: boolean }>;
  orientation?: 'horizontal' | 'vertical';
}

export const RadioGroupField: React.FC<RadioGroupFieldProps> = ({
  name,
  control,
  options,
  orientation = 'vertical',
  disabled,
  onChange,
  ariaDescribedBy,
  ariaInvalid,
  ...props
}) => {
  const handleChange: OnStringChange = (value) => {
    onChange?.(value);
  };

  if (control) {
    return (
      <Controller
        name={name}
        control={control}
        render={({ field }) => (
          <RadioGroup
            value={field.value}
            onValueChange={(value: string) => {
              field.onChange(value);
              handleChange(value);
            }}
            disabled={disabled}
            orientation={orientation}
            aria-describedby={ariaDescribedBy}
            aria-invalid={ariaInvalid}
          >
            {options.map((option) => (
              <div key={option.value} className="flex items-center space-x-2">
                <RadioGroupItem 
                  value={option.value} 
                  id={`${name}-${option.value}`}
                  disabled={option.disabled}
                />
                <Label htmlFor={`${name}-${option.value}`}>
                  {option.label}
                </Label>
              </div>
            ))}
          </RadioGroup>
        )}
      />
    );
  }
  
  return (
    <RadioGroup
      defaultValue={props.defaultValue as string}
      onValueChange={handleChange}
      disabled={disabled}
      orientation={orientation}
      aria-describedby={ariaDescribedBy}
      aria-invalid={ariaInvalid}
    >
      {options.map((option) => (
        <div key={option.value} className="flex items-center space-x-2">
          <RadioGroupItem 
            value={option.value} 
            id={`${name}-${option.value}`}
            disabled={option.disabled}
          />
          <Label htmlFor={`${name}-${option.value}`}>
            {option.label}
          </Label>
        </div>
      ))}
    </RadioGroup>
  );
};
```

#### Slider Field
```typescript
// src/components/fields/SliderField.tsx - NEW

import { Slider } from '@/components/ui/slider';
import { Controller } from 'react-hook-form';
import type { OnSliderChange } from '@/types/events';
import type { FieldProps } from './types';

export interface SliderFieldProps extends FieldProps {
  min?: number;
  max?: number;
  step?: number;
  showValue?: boolean;
}

export const SliderField: React.FC<SliderFieldProps> = ({
  name,
  control,
  min = 0,
  max = 100,
  step = 1,
  showValue = true,
  disabled,
  onChange,
  ariaDescribedBy,
  ariaInvalid,
  ...props
}) => {
  const [localValue, setLocalValue] = useState<number[]>([props.defaultValue as number || min]);

  const handleChange: OnSliderChange = (values) => {
    setLocalValue(values);
    onChange?.(values[0]);
  };

  if (control) {
    return (
      <Controller
        name={name}
        control={control}
        render={({ field }) => (
          <div className="space-y-2">
            <Slider
              value={[field.value || min]}
              onValueChange={(values: number[]) => {
                field.onChange(values[0]);
                handleChange(values);
              }}
              min={min}
              max={max}
              step={step}
              disabled={disabled}
              aria-describedby={ariaDescribedBy}
              aria-invalid={ariaInvalid}
              className={props.className}
            />
            {showValue && (
              <div className="text-sm text-muted-foreground text-center">
                {field.value || min}
              </div>
            )}
          </div>
        )}
      />
    );
  }
  
  return (
    <div className="space-y-2">
      <Slider
        value={localValue}
        onValueChange={handleChange}
        min={min}
        max={max}
        step={step}
        disabled={disabled}
        aria-describedby={ariaDescribedBy}
        aria-invalid={ariaInvalid}
        className={props.className}
      />
      {showValue && (
        <div className="text-sm text-muted-foreground text-center">
          {localValue[0]}
        </div>
      )}
    </div>
  );
};
```

#### Rating Field
```typescript
// src/components/fields/RatingField.tsx - NEW

import { Star } from 'lucide-react';
import { Controller } from 'react-hook-form';
import type { OnNumberChange } from '@/types/events';
import type { FieldProps } from './types';

export interface RatingFieldProps extends FieldProps {
  maxRating?: number;
  allowHalf?: boolean;
  showValue?: boolean;
}

export const RatingField: React.FC<RatingFieldProps> = ({
  name,
  control,
  maxRating = 5,
  allowHalf = false,
  showValue = false,
  disabled,
  onChange,
  ariaDescribedBy,
  ariaInvalid,
  ...props
}) => {
  const [hoverValue, setHoverValue] = useState<number | null>(null);

  const handleClick = (value: number): void => {
    if (!disabled) {
      onChange?.(value);
    }
  };

  const renderStars = (currentValue: number) => {
    const displayValue = hoverValue ?? currentValue;
    
    return (
      <div 
        className="flex gap-1"
        onMouseLeave={() => setHoverValue(null)}
        role="radiogroup"
        aria-label={`Rating: ${currentValue} out of ${maxRating} stars`}
        aria-describedby={ariaDescribedBy}
        aria-invalid={ariaInvalid}
      >
        {Array.from({ length: maxRating }, (_, i) => {
          const starValue = i + 1;
          const filled = displayValue >= starValue;
          
          return (
            <button
              key={i}
              type="button"
              onClick={() => handleClick(starValue)}
              onMouseEnter={() => !disabled && setHoverValue(starValue)}
              disabled={disabled}
              className={cn(
                "transition-colors",
                disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer hover:scale-110",
                filled ? "text-yellow-400" : "text-gray-300"
              )}
              aria-label={`${starValue} star${starValue !== 1 ? 's' : ''}`}
            >
              <Star className="w-6 h-6" fill={filled ? "currentColor" : "none"} />
            </button>
          );
        })}
      </div>
    );
  };

  if (control) {
    return (
      <Controller
        name={name}
        control={control}
        render={({ field }) => (
          <div className="space-y-2">
            {renderStars(field.value || 0)}
            {showValue && (
              <span className="text-sm text-muted-foreground">
                {field.value || 0} / {maxRating}
              </span>
            )}
          </div>
        )}
      />
    );
  }
  
  const [value, setValue] = useState(props.defaultValue as number || 0);
  
  return (
    <div className="space-y-2">
      {renderStars(value)}
      {showValue && (
        <span className="text-sm text-muted-foreground">
          {value} / {maxRating}
        </span>
      )}
    </div>
  );
};
```

#### File Upload Field (Fixed)
```typescript
// src/components/fields/FileUploadField.tsx - UPDATE WITH TYPES

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Upload, X, FileIcon } from 'lucide-react';
import { Controller } from 'react-hook-form';
import type { FileChange } from '@/types/events';
import type { FieldProps } from './types';

export interface FileUploadFieldProps extends FieldProps {
  accept?: string;
  maxSize?: number;
  multiple?: boolean;
  maxFiles?: number;
}

export const FileUploadField: React.FC<FileUploadFieldProps> = ({
  name,
  control,
  accept,
  maxSize = 5 * 1024 * 1024,
  multiple = false,
  maxFiles = 1,
  disabled,
  onChange,
  ariaDescribedBy,
  ariaInvalid,
  ...props
}) => {
  const [files, setFiles] = useState<File[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  
  const handleFileChange = (e: FileChange): void => {
    const selectedFiles = Array.from(e.target.files || []);
    const validFiles: File[] = [];
    const fileErrors: string[] = [];
    
    selectedFiles.forEach((file) => {
      if (maxSize && file.size > maxSize) {
        fileErrors.push(`${file.name} exceeds maximum size of ${formatFileSize(maxSize)}`);
      } else if (accept && !file.type.match(accept.replace('*', '.*'))) {
        fileErrors.push(`${file.name} has invalid type`);
      } else {
        validFiles.push(file);
      }
    });
    
    if (multiple && validFiles.length > maxFiles) {
      fileErrors.push(`Maximum ${maxFiles} files allowed`);
      validFiles.splice(maxFiles);
    }
    
    setFiles(validFiles);
    setErrors(fileErrors);
    onChange?.(multiple ? validFiles : validFiles[0]);
  };
  
  const removeFile = (index: number): void => {
    const newFiles = files.filter((_, i) => i !== index);
    setFiles(newFiles);
    onChange?.(multiple ? newFiles : newFiles[0] || null);
  };
  
  const formatFileSize = (bytes: number): string => {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;
    
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    
    return `${size.toFixed(1)} ${units[unitIndex]}`;
  };

  if (control) {
    return (
      <Controller
        name={name}
        control={control}
        render={({ field: { onChange: fieldOnChange, value, ...field } }) => (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Input
                {...field}
                type="file"
                id={name}
                accept={accept}
                multiple={multiple}
                onChange={(e: FileChange) => {
                  handleFileChange(e);
                  fieldOnChange(multiple ? files : files[0]);
                }}
                disabled={disabled}
                className="hidden"
                aria-describedby={ariaDescribedBy}
                aria-invalid={ariaInvalid}
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => document.getElementById(name)?.click()}
                disabled={disabled}
              >
                <Upload className="mr-2 h-4 w-4" />
                Choose File{multiple && 's'}
              </Button>
            </div>
            
            {files.length > 0 && (
              <ul className="space-y-1">
                {files.map((file, index) => (
                  <li key={index} className="flex items-center justify-between p-2 border rounded">
                    <div className="flex items-center gap-2">
                      <FileIcon className="h-4 w-4" />
                      <span className="text-sm">{file.name}</span>
                      <span className="text-xs text-muted-foreground">
                        ({formatFileSize(file.size)})
                      </span>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(index)}
                      disabled={disabled}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </li>
                ))}
              </ul>
            )}
            
            {errors.length > 0 && (
              <ul className="text-sm text-red-500" role="alert">
                {errors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            )}
          </div>
        )}
      />
    );
  }
  
  // Uncontrolled version
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Input
          type="file"
          id={name}
          name={name}
          accept={accept}
          multiple={multiple}
          onChange={handleFileChange}
          disabled={disabled}
          className="hidden"
          aria-describedby={ariaDescribedBy}
          aria-invalid={ariaInvalid}
        />
        <Button
          type="button"
          variant="outline"
          onClick={() => document.getElementById(name)?.click()}
          disabled={disabled}
        >
          <Upload className="mr-2 h-4 w-4" />
          Choose File{multiple && 's'}
        </Button>
      </div>
      
      {files.length > 0 && (
        <ul className="space-y-1">
          {files.map((file, index) => (
            <li key={index} className="flex items-center justify-between p-2 border rounded">
              <div className="flex items-center gap-2">
                <FileIcon className="h-4 w-4" />
                <span className="text-sm">{file.name}</span>
                <span className="text-xs text-muted-foreground">
                  ({formatFileSize(file.size)})
                </span>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeFile(index)}
                disabled={disabled}
              >
                <X className="h-4 w-4" />
              </Button>
            </li>
          ))}
        </ul>
      )}
      
      {errors.length > 0 && (
        <ul className="text-sm text-red-500" role="alert">
          {errors.map((error, index) => (
            <li key={index}>{error}</li>
          ))}
        </ul>
      )}
    </div>
  );
};
```

### 3.5 Implement ALL Specialized Fields

#### Currency Field
```typescript
// src/components/fields/specialized/CurrencyField.tsx

import { Input } from '@/components/ui/input';
import { Controller } from 'react-hook-form';
import type { InputChange } from '@/types/events';
import type { FieldProps } from '../types';

export interface CurrencyFieldProps extends FieldProps {
  currency?: string;
  locale?: string;
  allowNegative?: boolean;
}

export const CurrencyField: React.FC<CurrencyFieldProps> = ({
  name,
  control,
  currency = 'USD',
  locale = 'en-US',
  allowNegative = false,
  disabled,
  onChange,
  ariaDescribedBy,
  ariaInvalid,
  ...props
}) => {
  const formatCurrency = (value: number): string => {
    if (isNaN(value)) return '';
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency,
    }).format(value);
  };
  
  const parseCurrency = (value: string): number => {
    const cleaned = value.replace(/[^0-9.-]+/g, '');
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? 0 : parsed;
  };

  const getCurrencySymbol = (): string => {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency,
    }).format(0).replace(/[\d\s.,]/g, '');
  };

  const handleChange = (e: InputChange): void => {
    const parsed = parseCurrency(e.target.value);
    if (!allowNegative && parsed < 0) return;
    onChange?.(parsed);
  };
  
  if (control) {
    return (
      <Controller
        name={name}
        control={control}
        render={({ field, fieldState }) => (
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              {getCurrencySymbol()}
            </span>
            <Input
              {...field}
              id={name}
              type="text"
              inputMode="decimal"
              className={cn(
                "pl-8",
                fieldState.error && "border-red-500"
              )}
              value={field.value ? formatCurrency(field.value) : ''}
              onChange={(e: InputChange) => {
                const parsed = parseCurrency(e.target.value);
                if (!allowNegative && parsed < 0) return;
                field.onChange(parsed);
                onChange?.(parsed);
              }}
              disabled={disabled}
              aria-describedby={ariaDescribedBy}
              aria-invalid={ariaInvalid || !!fieldState.error}
            />
          </div>
        )}
      />
    );
  }
  
  return (
    <div className="relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
        {getCurrencySymbol()}
      </span>
      <Input
        id={name}
        name={name}
        type="text"
        inputMode="decimal"
        className="pl-8"
        defaultValue={props.defaultValue ? formatCurrency(props.defaultValue as number) : ''}
        onChange={handleChange}
        disabled={disabled}
        aria-describedby={ariaDescribedBy}
        aria-invalid={ariaInvalid}
      />
    </div>
  );
};
```

#### Email Field
```typescript
// src/components/fields/specialized/EmailField.tsx

import { Input } from '@/components/ui/input';
import { Controller } from 'react-hook-form';
import type { InputChange } from '@/types/events';
import type { FieldProps } from '../types';

export const EmailField: React.FC<FieldProps> = ({
  name,
  control,
  disabled,
  onChange,
  ariaDescribedBy,
  ariaInvalid,
  ...props
}) => {
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (control) {
    return (
      <Controller
        name={name}
        control={control}
        rules={{
          pattern: {
            value: emailPattern,
            message: 'Please enter a valid email address'
          }
        }}
        render={({ field, fieldState }) => (
          <Input
            {...field}
            id={name}
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder={props.placeholder || "email@example.com"}
            disabled={disabled}
            className={cn(
              fieldState.error && "border-red-500"
            )}
            onChange={(e: InputChange) => {
              field.onChange(e.target.value);
              onChange?.(e.target.value);
            }}
            aria-describedby={ariaDescribedBy}
            aria-invalid={ariaInvalid || !!fieldState.error}
          />
        )}
      />
    );
  }
  
  return (
    <Input
      id={name}
      name={name}
      type="email"
      inputMode="email"
      autoComplete="email"
      defaultValue={props.defaultValue as string}
      placeholder={props.placeholder || "email@example.com"}
      onChange={(e: InputChange) => onChange?.(e.target.value)}
      disabled={disabled}
      aria-describedby={ariaDescribedBy}
      aria-invalid={ariaInvalid}
    />
  );
};
```

#### Phone Field
```typescript
// src/components/fields/specialized/PhoneField.tsx

import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Controller } from 'react-hook-form';
import type { InputChange, OnStringChange } from '@/types/events';
import type { FieldProps } from '../types';

const COUNTRY_CODES = [
  { code: '+1', country: 'US/CA', flag: '🇺🇸' },
  { code: '+44', country: 'UK', flag: '🇬🇧' },
  { code: '+49', country: 'DE', flag: '🇩🇪' },
  { code: '+33', country: 'FR', flag: '🇫🇷' },
  { code: '+81', country: 'JP', flag: '🇯🇵' },
];

export interface PhoneFieldProps extends FieldProps {
  defaultCountryCode?: string;
}

export const PhoneField: React.FC<PhoneFieldProps> = ({
  name,
  control,
  defaultCountryCode = '+1',
  disabled,
  onChange,
  ariaDescribedBy,
  ariaInvalid,
  ...props
}) => {
  const [countryCode, setCountryCode] = useState(defaultCountryCode);
  
  const formatPhone = (value: string, code: string): string => {
    const cleaned = value.replace(/\D/g, '');
    
    if (code === '+1' && cleaned.length === 10) {
      const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
      if (match) {
        return `(${match[1]}) ${match[2]}-${match[3]}`;
      }
    }
    
    return value;
  };
  
  const parsePhone = (value: string): string => {
    return value.replace(/\D/g, '');
  };

  if (control) {
    return (
      <Controller
        name={name}
        control={control}
        rules={{
          pattern: {
            value: /^[0-9\s\-\(\)]+$/,
            message: 'Invalid phone number'
          },
          minLength: {
            value: 10,
            message: 'Phone number too short'
          }
        }}
        render={({ field, fieldState }) => {
          const fullNumber = `${countryCode}${parsePhone(field.value || '')}`;
          
          return (
            <div className="flex gap-2">
              <Select
                value={countryCode}
                onValueChange={(value: string) => {
                  setCountryCode(value);
                  onChange?.(fullNumber);
                }}
                disabled={disabled}
              >
                <SelectTrigger className="w-32" aria-label="Country code">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {COUNTRY_CODES.map((country) => (
                    <SelectItem key={country.code} value={country.code}>
                      <span className="flex items-center gap-2">
                        <span>{country.flag}</span>
                        <span>{country.code}</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Input
                {...field}
                id={name}
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                placeholder="(555) 123-4567"
                value={formatPhone(field.value || '', countryCode)}
                onChange={(e: InputChange) => {
                  const cleaned = parsePhone(e.target.value);
                  field.onChange(cleaned);
                  onChange?.(fullNumber);
                }}
                disabled={disabled}
                className={cn(
                  "flex-1",
                  fieldState.error && "border-red-500"
                )}
                aria-describedby={ariaDescribedBy}
                aria-invalid={ariaInvalid || !!fieldState.error}
              />
            </div>
          );
        }}
      />
    );
  }
  
  return (
    <div className="flex gap-2">
      <Select
        value={countryCode}
        onValueChange={setCountryCode}
        disabled={disabled}
      >
        <SelectTrigger className="w-32" aria-label="Country code">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {COUNTRY_CODES.map((country) => (
            <SelectItem key={country.code} value={country.code}>
              <span className="flex items-center gap-2">
                <span>{country.flag}</span>
                <span>{country.code}</span>
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      
      <Input
        id={name}
        name={name}
        type="tel"
        inputMode="tel"
        autoComplete="tel"
        placeholder="(555) 123-4567"
        defaultValue={props.defaultValue as string}
        onChange={(e: InputChange) => {
          const cleaned = parsePhone(e.target.value);
          onChange?.(`${countryCode}${cleaned}`);
        }}
        disabled={disabled}
        className="flex-1"
        aria-describedby={ariaDescribedBy}
        aria-invalid={ariaInvalid}
      />
    </div>
  );
};
```

### 3.6 Update Field Registry to Include ALL Components
```typescript
// src/core/field-registry.ts - UPDATE initializeFieldRegistry

import { TextField } from '@/components/fields/TextField';
import { NumberField } from '@/components/fields/NumberField';
import { TextAreaField } from '@/components/fields/TextAreaField';
import { SelectField } from '@/components/fields/SelectField';
import { CheckboxField } from '@/components/fields/CheckboxField';
import { RadioGroupField } from '@/components/fields/RadioGroupField';
import { DateField } from '@/components/fields/DateField';
import { FileUploadField } from '@/components/fields/FileUploadField';
import { SliderField } from '@/components/fields/SliderField';
import { RatingField } from '@/components/fields/RatingField';
import { RepeaterField } from '@/components/fields/RepeaterField';
// Specialized fields
import { CurrencyField } from '@/components/fields/specialized/CurrencyField';
import { PercentageField } from '@/components/fields/specialized/PercentageField';
import { PhoneField } from '@/components/fields/specialized/PhoneField';
import { EmailField } from '@/components/fields/specialized/EmailField';
import { PostcodeField } from '@/components/fields/specialized/PostcodeField';
import { IBANField } from '@/components/fields/specialized/IBANField';
import { ColorPickerField } from '@/components/fields/specialized/ColorPickerField';
import { TagsField } from '@/components/fields/specialized/TagsField';

export function initializeFieldRegistry(): void {
  const registry = FieldRegistry.getInstance();
  
  // Base fields
  registry.register('Text', { component: TextField });
  registry.register('Number', { component: NumberField });
  registry.register('TextArea', { component: TextAreaField });
  registry.register('Select', { component: SelectField });
  registry.register('RadioGroup', { component: RadioGroupField });
  registry.register('Checkbox', { component: CheckboxField });
  registry.register('Date', { component: DateField });
  registry.register('FileUpload', { component: FileUploadField });
  registry.register('Repeater', { component: RepeaterField });
  registry.register('Rating', { component: RatingField });
  registry.register('Slider', { component: SliderField });
  
  // Specialized fields
  registry.register('Currency', { component: CurrencyField });
  registry.register('Percentage', { component: PercentageField });
  registry.register('Phone', { component: PhoneField });
  registry.register('Email', { component: EmailField });
  registry.register('Postcode', { component: PostcodeField });
  registry.register('IBAN', { component: IBANField });
  registry.register('ColorPicker', { component: ColorPickerField });
  registry.register('Tags', { component: TagsField });
}
```

### 3.7 Create Component Tests
```typescript
// src/components/fields/__tests__/TextField.test.tsx

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { TextField } from '../TextField';
import { useForm, FormProvider } from 'react-hook-form';

describe('TextField', () => {
  it('renders with label and required indicator', () => {
    render(
      <TextField
        name="test"
        label="Test Field"
        required
      />
    );
    
    expect(screen.getByLabelText(/Test Field/)).toBeInTheDocument();
    expect(screen.getByLabelText('required')).toBeInTheDocument();
  });
  
  it('displays error message with proper accessibility', async () => {
    const TestForm = () => {
      const methods = useForm();
      return (
        <FormProvider {...methods}>
          <TextField
            name="test"
            label="Test"
            control={methods.control}
            rules={{ required: 'This field is required' }}
          />
          <button onClick={() => methods.trigger()}>Validate</button>
        </FormProvider>
      );
    };
    
    render(<TestForm />);
    fireEvent.click(screen.getByText('Validate'));
    
    await waitFor(() => {
      const error = screen.getByRole('alert');
      expect(error).toHaveTextContent('This field is required');
      
      const input = screen.getByLabelText('Test');
      expect(input).toHaveAttribute('aria-invalid', 'true');
      expect(input).toHaveAttribute('aria-describedby', expect.stringContaining('error'));
    });
  });
  
  it('handles onChange events with proper typing', () => {
    const onChange = jest.fn();
    
    render(
      <TextField
        name="test"
        onChange={onChange}
      />
    );
    
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'test value' } });
    
    expect(onChange).toHaveBeenCalledWith('test value');
  });
});
```

## Success Criteria Checklist
- ✅ All TypeScript implicit any errors resolved
- ✅ Event types properly defined and imported from `types/events.ts`
- ✅ All 18+ field types registered and functional:
  - ✅ Text, Number, TextArea (updated to use shadcn/ui)
  - ✅ Select, Checkbox, Date (updated to use shadcn/ui)
  - ✅ RadioGroup (new)
  - ✅ FileUpload (new with proper types)
  - ✅ Repeater (new)
  - ✅ Rating (new)
  - ✅ Slider (new)
  - ✅ Currency (new)
  - ✅ Percentage (new)
  - ✅ Phone (new)
  - ✅ Email (new)
  - ✅ Postcode (new)
  - ✅ IBAN (new)
  - ✅ ColorPicker (new)
  - ✅ Tags (new)
- ✅ All fields integrate with React Hook Form
- ✅ Consistent styling with shadcn/ui components
- ✅ Full accessibility implementation:
  - ✅ ARIA labels and descriptions
  - ✅ Error associations
  - ✅ Invalid states
  - ✅ Keyboard navigation
- ✅ Field validation works correctly
- ✅ Custom fields can be registered
- ✅ Field factory creates components dynamically
- ✅ Component tests with >80% coverage

## Validation Commands
```bash
# Run all checks
npm run lint
npm run typecheck
npm run test -- --ci
npm run build
npm run size

# Verify no TypeScript errors
npm run typecheck 2>&1 | grep -c "error TS" # Should output 0
```

## Implementation Priority
1. **URGENT**: Create `types/events.ts` file first
2. **URGENT**: Fix TypeScript errors in existing components
3. **HIGH**: Update existing 6 components to use shadcn/ui
4. **HIGH**: Implement missing 12 components
5. **MEDIUM**: Add accessibility features
6. **MEDIUM**: Create component tests
7. **LOW**: Add Storybook stories

## Next Steps
With the complete field registry:
1. Build the validation engine (Step 4)
2. Create comprehensive Storybook documentation
3. Set up visual regression tests
4. Begin integration with form renderer
5. Add i18n support for field labels/errors