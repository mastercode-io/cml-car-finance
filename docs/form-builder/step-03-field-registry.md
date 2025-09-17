# Step 3: Field Registry & Base Components

## Step Description
Build the field registry system and create all base field components with shadcn/ui integration. This step establishes the component library that will render form fields based on schema definitions, ensuring consistent behavior and styling across all form instances.

## Prerequisites
- Step 2 (Schema Foundation) completed
- shadcn/ui components installed
- React Hook Form configured
- Tailwind CSS set up
- TypeScript interfaces defined

## Detailed To-Do List

### 3.1 Field Registry Core
```typescript
// src/core/field-registry.ts

export interface FieldComponent {
  component: React.ComponentType<FieldProps>;
  defaultProps?: Partial<FieldProps>;
  validator?: (value: any) => boolean | string;
  formatter?: (value: any) => any;
  parser?: (value: any) => any;
}

export class FieldRegistry {
  private static instance: FieldRegistry;
  private fields: Map<WidgetType, FieldComponent> = new Map();
  
  static getInstance(): FieldRegistry {
    if (!FieldRegistry.instance) {
      FieldRegistry.instance = new FieldRegistry();
    }
    return FieldRegistry.instance;
  }
  
  register(type: WidgetType, field: FieldComponent): void {
    if (this.fields.has(type)) {
      console.warn(`Field type ${type} is being overridden`);
    }
    this.fields.set(type, field);
  }
  
  get(type: WidgetType): FieldComponent | undefined {
    return this.fields.get(type);
  }
  
  getComponent(type: WidgetType): React.ComponentType<FieldProps> {
    const field = this.get(type);
    if (!field) {
      throw new Error(`Unknown field type: ${type}`);
    }
    return field.component;
  }
  
  list(): WidgetType[] {
    return Array.from(this.fields.keys());
  }
}

// Initialize default fields
export function initializeFieldRegistry(): void {
  const registry = FieldRegistry.getInstance();
  
  // Register all default components
  registry.register('Text', { component: TextField });
  registry.register('Number', { component: NumberField });
  registry.register('Select', { component: SelectField });
  // ... register all other fields
}
```

### 3.2 Base Field Interface
```typescript
// src/components/fields/types.ts

export interface FieldProps {
  name: string;
  label: string;
  value?: any;
  defaultValue?: any;
  placeholder?: string;
  description?: string;
  helpText?: string;
  error?: string | FieldError;
  disabled?: boolean;
  readOnly?: boolean;
  required?: boolean;
  className?: string;
  onChange?: (value: any) => void;
  onBlur?: () => void;
  onFocus?: () => void;
  control?: Control<any>;
  rules?: RegisterOptions;
  // Widget-specific props
  [key: string]: any;
}

export interface FieldError {
  type: string;
  message: string;
}

// HOC for field wrapper
export function withFieldWrapper<P extends FieldProps>(
  Component: React.ComponentType<P>
): React.ComponentType<P> {
  return function WrappedField(props: P) {
    const { label, error, description, required, className } = props;
    
    return (
      <div className={cn('space-y-2', className)}>
        {label && (
          <Label htmlFor={props.name} className="text-sm font-medium">
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </Label>
        )}
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
        <Component {...props} />
        {error && (
          <p className="text-sm text-red-500" role="alert">
            {typeof error === 'string' ? error : error.message}
          </p>
        )}
      </div>
    );
  };
}
```

### 3.3 Text Field Component
```typescript
// src/components/fields/TextField.tsx

import { Input } from '@/components/ui/input';
import { Controller } from 'react-hook-form';

export const TextField: React.FC<FieldProps> = ({
  name,
  control,
  rules,
  disabled,
  readOnly,
  placeholder,
  onChange,
  onBlur,
  ...props
}) => {
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
            className={cn(
              fieldState.error && 'border-red-500',
              props.className
            )}
            onChange={(e) => {
              field.onChange(e.target.value);
              onChange?.(e.target.value);
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
  
  // Uncontrolled version
  return (
    <Input
      id={name}
      name={name}
      type="text"
      defaultValue={props.defaultValue}
      placeholder={placeholder}
      disabled={disabled}
      readOnly={readOnly}
      className={props.className}
      onChange={(e) => onChange?.(e.target.value)}
      onBlur={onBlur}
    />
  );
};
```

### 3.4 Select Field Component
```typescript
// src/components/fields/SelectField.tsx

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export interface SelectFieldProps extends FieldProps {
  options: Array<{ label: string; value: string | number }>;
  multiple?: boolean;
  searchable?: boolean;
}

export const SelectField: React.FC<SelectFieldProps> = ({
  name,
  control,
  options,
  placeholder = 'Select an option',
  disabled,
  onChange,
  ...props
}) => {
  if (control) {
    return (
      <Controller
        name={name}
        control={control}
        render={({ field }) => (
          <Select
            value={field.value}
            onValueChange={(value) => {
              field.onChange(value);
              onChange?.(value);
            }}
            disabled={disabled}
          >
            <SelectTrigger id={name}>
              <SelectValue placeholder={placeholder} />
            </SelectTrigger>
            <SelectContent>
              {options.map((option) => (
                <SelectItem key={option.value} value={String(option.value)}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      />
    );
  }
  
  // Uncontrolled version
  return (
    <Select
      defaultValue={props.defaultValue}
      onValueChange={onChange}
      disabled={disabled}
    >
      <SelectTrigger id={name}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option.value} value={String(option.value)}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};
```

### 3.5 Date Field Component
```typescript
// src/components/fields/DateField.tsx

import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';

export interface DateFieldProps extends FieldProps {
  minDate?: Date;
  maxDate?: Date;
  dateFormat?: string;
}

export const DateField: React.FC<DateFieldProps> = ({
  name,
  control,
  minDate,
  maxDate,
  dateFormat = 'PPP',
  disabled,
  placeholder = 'Pick a date',
  ...props
}) => {
  if (control) {
    return (
      <Controller
        name={name}
        control={control}
        render={({ field }) => (
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  'w-full justify-start text-left font-normal',
                  !field.value && 'text-muted-foreground'
                )}
                disabled={disabled}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {field.value ? (
                  format(field.value, dateFormat)
                ) : (
                  <span>{placeholder}</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={field.value}
                onSelect={field.onChange}
                disabled={(date) =>
                  (minDate && date < minDate) ||
                  (maxDate && date > maxDate) ||
                  false
                }
                initialFocus
              />
            </PopoverContent>
          </Popover>
        )}
      />
    );
  }
  
  // Uncontrolled implementation
  return <DatePickerUncontrolled {...props} />;
};
```

### 3.6 File Upload Field
```typescript
// src/components/fields/FileUploadField.tsx

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Upload, X } from 'lucide-react';

export interface FileUploadFieldProps extends FieldProps {
  accept?: string;
  maxSize?: number; // in bytes
  multiple?: boolean;
  maxFiles?: number;
}

export const FileUploadField: React.FC<FileUploadFieldProps> = ({
  name,
  control,
  accept,
  maxSize = 5 * 1024 * 1024, // 5MB default
  multiple = false,
  maxFiles = 1,
  disabled,
  ...props
}) => {
  const [files, setFiles] = useState<File[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    const validFiles: File[] = [];
    const fileErrors: string[] = [];
    
    selectedFiles.forEach((file) => {
      if (maxSize && file.size > maxSize) {
        fileErrors.push(`${file.name} exceeds maximum size`);
      } else if (accept && !file.type.match(accept)) {
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
    
    // Update form value
    if (control) {
      const value = multiple ? validFiles : validFiles[0];
      control.setValue(name, value);
    }
  };
  
  const removeFile = (index: number) => {
    const newFiles = files.filter((_, i) => i !== index);
    setFiles(newFiles);
    if (control) {
      const value = multiple ? newFiles : newFiles[0];
      control.setValue(name, value);
    }
  };
  
  return (
    <div className="space-y-2">
      <div className="flex items-center space-x-2">
        <Input
          type="file"
          id={name}
          accept={accept}
          multiple={multiple}
          onChange={handleFileChange}
          disabled={disabled}
          className="hidden"
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
            <li key={index} className="flex items-center justify-between">
              <span className="text-sm">{file.name}</span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeFile(index)}
              >
                <X className="h-4 w-4" />
              </Button>
            </li>
          ))}
        </ul>
      )}
      
      {errors.length > 0 && (
        <ul className="text-sm text-red-500">
          {errors.map((error, index) => (
            <li key={index}>{error}</li>
          ))}
        </ul>
      )}
    </div>
  );
};
```

### 3.7 Specialized Fields
```typescript
// src/components/fields/specialized/CurrencyField.tsx

export const CurrencyField: React.FC<FieldProps> = ({
  name,
  control,
  currency = 'USD',
  locale = 'en-US',
  ...props
}) => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency,
    }).format(value);
  };
  
  const parseCurrency = (value: string) => {
    return parseFloat(value.replace(/[^0-9.-]+/g, ''));
  };
  
  return (
    <Controller
      name={name}
      control={control}
      render={({ field }) => (
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2">
            {getCurrencySymbol(currency)}
          </span>
          <Input
            {...field}
            type="text"
            className="pl-8"
            value={field.value ? formatCurrency(field.value) : ''}
            onChange={(e) => {
              const parsed = parseCurrency(e.target.value);
              if (!isNaN(parsed)) {
                field.onChange(parsed);
              }
            }}
          />
        </div>
      )}
    />
  );
};

// src/components/fields/specialized/PhoneField.tsx

export const PhoneField: React.FC<FieldProps> = ({
  name,
  control,
  countryCode = '+1',
  ...props
}) => {
  const formatPhone = (value: string) => {
    // Format based on country code
    const cleaned = value.replace(/\D/g, '');
    if (countryCode === '+1') {
      // US format: (xxx) xxx-xxxx
      const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
      if (match) {
        return `(${match[1]}) ${match[2]}-${match[3]}`;
      }
    }
    return value;
  };
  
  return (
    <Controller
      name={name}
      control={control}
      rules={{
        pattern: {
          value: /^\+?[1-9]\d{1,14}$/,
          message: 'Invalid phone number'
        }
      }}
      render={({ field }) => (
        <div className="flex space-x-2">
          <Select defaultValue={countryCode}>
            <SelectTrigger className="w-24">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="+1">+1</SelectItem>
              <SelectItem value="+44">+44</SelectItem>
              <SelectItem value="+49">+49</SelectItem>
            </SelectContent>
          </Select>
          <Input
            {...field}
            type="tel"
            placeholder="(555) 123-4567"
            value={formatPhone(field.value || '')}
            onChange={(e) => {
              const cleaned = e.target.value.replace(/\D/g, '');
              field.onChange(cleaned);
            }}
          />
        </div>
      )}
    />
  );
};
```

### 3.8 Field Factory
```typescript
// src/components/fields/FieldFactory.tsx

export const FieldFactory: React.FC<{
  type: WidgetType;
  fieldProps: FieldProps;
}> = ({ type, fieldProps }) => {
  const registry = FieldRegistry.getInstance();
  const fieldComponent = registry.get(type);
  
  if (!fieldComponent) {
    console.error(`Unknown field type: ${type}`);
    return <div>Unknown field type: {type}</div>;
  }
  
  const Component = fieldComponent.component;
  const mergedProps = {
    ...fieldComponent.defaultProps,
    ...fieldProps,
  };
  
  // Apply wrapper HOC
  const WrappedComponent = withFieldWrapper(Component);
  
  return <WrappedComponent {...mergedProps} />;
};
```

## Test Cases

### Registry Tests
```typescript
describe('Field Registry', () => {
  it('should register and retrieve field components', () => {
    const registry = FieldRegistry.getInstance();
    const mockComponent = () => <div>Mock</div>;
    
    registry.register('Custom', { component: mockComponent });
    expect(registry.get('Custom')?.component).toBe(mockComponent);
  });
  
  it('should list all registered field types', () => {
    const registry = FieldRegistry.getInstance();
    const types = registry.list();
    
    expect(types).toContain('Text');
    expect(types).toContain('Number');
    expect(types).toContain('Select');
  });
});
```

### Component Tests
```typescript
describe('Field Components', () => {
  it('should render text field with validation', async () => {
    const { getByLabelText, getByRole } = render(
      <TextField
        name="test"
        label="Test Field"
        required
        rules={{ required: 'Field is required' }}
      />
    );
    
    const input = getByLabelText('Test Field *');
    fireEvent.blur(input);
    
    await waitFor(() => {
      expect(getByRole('alert')).toHaveTextContent('Field is required');
    });
  });
  
  it('should handle file upload with size validation', () => {
    const { getByText } = render(
      <FileUploadField
        name="file"
        maxSize={1024}
        accept="image/*"
      />
    );
    
    // Test file size validation
    const file = new File(['x'.repeat(2048)], 'test.jpg', {
      type: 'image/jpeg'
    });
    
    // Simulate file selection
    // Assert error message appears
  });
});
```

## Success Criteria
- ✅ All 15+ field types registered and functional
- ✅ Fields integrate with React Hook Form
- ✅ Consistent styling with shadcn/ui
- ✅ Accessibility standards met (ARIA labels, roles)
- ✅ Field validation works correctly
- ✅ Custom fields can be registered
- ✅ Field factory creates components dynamically

## Implementation Notes

### Performance Optimizations
- Memoize field components with React.memo
- Lazy load specialized fields
- Use virtual scrolling for large select lists
- Debounce onChange handlers where appropriate

### Accessibility Requirements
- All fields must have associated labels
- Error messages linked via aria-describedby
- Keyboard navigation fully supported
- Screen reader announcements for changes

### Testing Strategy
- Unit test each field component
- Integration test with React Hook Form
- Visual regression testing with Storybook
- Accessibility testing with axe-core

## Next Steps
With the field registry complete:
1. Build the validation engine (Step 4)
2. Create Storybook stories for all fields
3. Document field API and usage
4. Set up visual regression tests
5. Begin integration with form renderer