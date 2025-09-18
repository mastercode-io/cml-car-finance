# Step 3: Field Registry & Base Components (Final Implementation Plan)

## Current Status
- ✅ Field Registry core structure exists
- ✅ 6 basic components created (Text, Number, TextArea, Select, Checkbox, Date)
- ❌ Components use raw HTML instead of shadcn/ui
- ❌ Missing 12+ required widget types
- ❌ No shared event types (types/events.ts)
- ❌ No accessibility implementation
- ❌ FieldFactory doesn't apply withFieldWrapper
- ❌ No component tests
- ❌ TypeScript errors remain

## Implementation Tasks (Priority Order)

### Task 1: Fix TypeScript Foundation (URGENT - Day 1)

#### 1.1 Create Event Types File
```bash
# Create the events type file
touch packages/form-engine/src/types/events.ts
```

```typescript
// packages/form-engine/src/types/events.ts
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

export type FieldValue = string | number | boolean | Date | File | FileList | null | undefined;
export type FieldValidator = (value: FieldValue) => boolean | string;
export type FieldFormatter = (value: FieldValue) => string;
export type FieldParser = (value: string) => FieldValue;
```

#### 1.2 Create shadcn Module Stubs
```bash
# Create shadcn stubs
touch packages/form-engine/src/types/shadcn.d.ts
```

```typescript
// packages/form-engine/src/types/shadcn.d.ts
declare module '@/lib/utils' {
  export function cn(...args: any[]): string;
}

declare module '@/components/ui/input' {
  export const Input: React.FC<any>;
}

declare module '@/components/ui/label' {
  export const Label: React.FC<any>;
}

declare module '@/components/ui/button' {
  export const Button: React.FC<any>;
}

declare module '@/components/ui/select' {
  export const Select: React.FC<any>;
  export const SelectContent: React.FC<any>;
  export const SelectItem: React.FC<any>;
  export const SelectTrigger: React.FC<any>;
  export const SelectValue: React.FC<any>;
}

declare module '@/components/ui/checkbox' {
  export const Checkbox: React.FC<any>;
}

declare module '@/components/ui/radio-group' {
  export const RadioGroup: React.FC<any>;
  export const RadioGroupItem: React.FC<any>;
}

declare module '@/components/ui/textarea' {
  export const Textarea: React.FC<any>;
}

declare module '@/components/ui/calendar' {
  export const Calendar: React.FC<any>;
}

declare module '@/components/ui/popover' {
  export const Popover: React.FC<any>;
  export const PopoverContent: React.FC<any>;
  export const PopoverTrigger: React.FC<any>;
}

declare module '@/components/ui/slider' {
  export const Slider: React.FC<any>;
}

declare module '@/components/ui/badge' {
  export const Badge: React.FC<any>;
}
```

#### 1.3 Update tsconfig
```json
// packages/form-engine/tsconfig.form-engine.json
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "rootDir": "src",
    "outDir": "dist",
    "types": ["node", "react"]
  },
  "include": ["src/**/*", "src/types/**/*"],
  "exclude": ["dist", "node_modules", "**/*.test.ts", "**/*.test.tsx"]
}
```

### Task 2: Update Base Infrastructure (Day 1)

#### 2.1 Fix FieldProps Interface
```typescript
// packages/form-engine/src/components/fields/types.ts
import type { Control, RegisterOptions } from 'react-hook-form';
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
  // Accessibility
  ariaLabel?: string;
  ariaDescribedBy?: string;
  ariaInvalid?: boolean;
}

export interface FieldError {
  type: string;
  message: string;
}
```

#### 2.2 Fix withFieldWrapper HOC
```typescript
// packages/form-engine/src/components/fields/withFieldWrapper.tsx
import React from 'react';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import type { FieldProps } from './types';

export function withFieldWrapper<P extends FieldProps>(
  Component: React.ComponentType<P>
): React.ComponentType<P> {
  return React.forwardRef<any, P>(function WrappedField(props, ref) {
    const { label, error, description, helpText, required, className, name } = props;
    const errorId = `${name}-error`;
    const descriptionId = `${name}-description`;
    const helpId = `${name}-help`;
    
    const ariaDescribedBy = cn(
      description && descriptionId,
      helpText && helpId,
      error && errorId
    );
    
    return (
      <div className={cn('space-y-2', className)}>
        {label && (
          <Label htmlFor={name} className="text-sm font-medium">
            {label}
            {required && (
              <span className="text-red-500 ml-1" aria-label="required">
                *
              </span>
            )}
          </Label>
        )}
        {description && (
          <p id={descriptionId} className="text-sm text-muted-foreground">
            {description}
          </p>
        )}
        <Component
          {...props}
          ref={ref}
          ariaDescribedBy={ariaDescribedBy}
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
  });
}
```

#### 2.3 Fix FieldFactory
```typescript
// packages/form-engine/src/components/fields/FieldFactory.tsx
import React from 'react';
import { FieldRegistry } from '@/core/field-registry';
import { withFieldWrapper } from './withFieldWrapper';
import type { WidgetType } from '@/types/schema.types';
import type { FieldProps } from './types';

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
  const WrappedComponent = withFieldWrapper(Component);
  
  const mergedProps = {
    ...fieldComponent.defaultProps,
    ...fieldProps,
  };
  
  return <WrappedComponent {...mergedProps} />;
};
```

### Task 3: Update Existing Components (Day 2)

#### 3.1 TextField with shadcn/ui and Types
```typescript
// packages/form-engine/src/components/fields/TextField.tsx
import React from 'react';
import { Input } from '@/components/ui/input';
import { Controller } from 'react-hook-form';
import { cn } from '@/lib/utils';
import type { InputChange } from '@/types/events';
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
  defaultValue,
  className,
  ...props
}) => {
  const handleChange = (e: InputChange): void => {
    onChange?.(e.target.value);
  };

  if (control) {
    return (
      <Controller
        name={name}
        control={control}
        rules={rules}
        defaultValue={defaultValue}
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
              className
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
      defaultValue={defaultValue as string || ''}
      placeholder={placeholder}
      disabled={disabled}
      readOnly={readOnly}
      aria-describedby={ariaDescribedBy}
      aria-invalid={ariaInvalid}
      className={className}
      onChange={handleChange}
      onBlur={onBlur}
    />
  );
};
```

#### 3.2 Update All Other Existing Components
Apply same pattern to:
- NumberField.tsx
- TextAreaField.tsx
- SelectField.tsx
- CheckboxField.tsx
- DateField.tsx

### Task 4: Implement Missing Components (Day 3-4)

#### 4.1 Create RadioGroupField
```typescript
// packages/form-engine/src/components/fields/RadioGroupField.tsx
import React from 'react';
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
  defaultValue,
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
        defaultValue={defaultValue}
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
      defaultValue={defaultValue as string}
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

#### 4.2 Implementation List for Remaining Components
Create these files with proper typing and shadcn/ui integration:

1. **SliderField.tsx** - Use Slider from shadcn/ui
2. **RatingField.tsx** - Custom with Star icons
3. **FileUploadField.tsx** - Input type="file" with Button wrapper
4. **RepeaterField.tsx** - Dynamic field array management
5. **specialized/CurrencyField.tsx** - Input with currency formatting
6. **specialized/PercentageField.tsx** - Number input with % suffix
7. **specialized/PhoneField.tsx** - Tel input with country code select
8. **specialized/EmailField.tsx** - Email input with validation
9. **specialized/PostcodeField.tsx** - Text input with postcode validation
10. **specialized/IBANField.tsx** - Text input with IBAN validation
11. **specialized/ColorPickerField.tsx** - Color input or custom picker
12. **specialized/TagsField.tsx** - Multi-select with badge display

### Task 5: Update Registry (Day 4)

```typescript
// packages/form-engine/src/core/field-registry.ts
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
// Specialized
import { CurrencyField } from '@/components/fields/specialized/CurrencyField';
import { PercentageField } from '@/components/fields/specialized/PercentageField';
import { PhoneField } from '@/components/fields/specialized/PhoneField';
import { EmailField } from '@/components/fields/specialized/EmailField';
import { PostcodeField } from '@/components/fields/specialized/PostcodeField';
import { IBANField } from '@/components/fields/specialized/IBANField';
import { ColorPickerField } from '@/components/fields/specialized/ColorPickerField';
import { TagsField } from '@/components/fields/specialized/TagsField';
import type { FieldProps } from '@/components/fields/types';

export function initializeFieldRegistry(): void {
  const registry = FieldRegistry.getInstance();
  
  // Type assertion for components with extra props
  const registerWithProps = <P extends FieldProps>(
    type: WidgetType,
    component: React.ComponentType<P>
  ) => {
    registry.register(type, {
      component: component as React.ComponentType<FieldProps>
    });
  };
  
  // Base fields
  registry.register('Text', { component: TextField });
  registry.register('Number', { component: NumberField });
  registry.register('TextArea', { component: TextAreaField });
  registerWithProps('Select', SelectField);
  registry.register('Checkbox', { component: CheckboxField });
  registerWithProps('RadioGroup', RadioGroupField);
  registry.register('Date', { component: DateField });
  registerWithProps('FileUpload', FileUploadField);
  registerWithProps('Repeater', RepeaterField);
  registerWithProps('Rating', RatingField);
  registerWithProps('Slider', SliderField);
  
  // Specialized fields
  registerWithProps('Currency', CurrencyField);
  registerWithProps('Percentage', PercentageField);
  registerWithProps('Phone', PhoneField);
  registry.register('Email', { component: EmailField });
  registerWithProps('Postcode', PostcodeField);
  registerWithProps('IBAN', IBANField);
  registerWithProps('ColorPicker', ColorPickerField);
  registerWithProps('Tags', TagsField);
}
```

### Task 6: Add Component Tests (Day 5)

#### 6.1 Create Test Setup
```typescript
// packages/form-engine/src/test/setup.ts
import '@testing-library/jest-dom';
```

#### 6.2 TextField Test
```typescript
// packages/form-engine/src/components/fields/__tests__/TextField.test.tsx
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { TextField } from '../TextField';
import { withFieldWrapper } from '../withFieldWrapper';

describe('TextField', () => {
  it('renders with label', () => {
    const WrappedTextField = withFieldWrapper(TextField);
    render(
      <WrappedTextField
        name="test"
        label="Test Field"
      />
    );
    
    expect(screen.getByLabelText(/Test Field/)).toBeInTheDocument();
  });
  
  it('shows required indicator', () => {
    const WrappedTextField = withFieldWrapper(TextField);
    render(
      <WrappedTextField
        name="test"
        label="Test Field"
        required
      />
    );
    
    expect(screen.getByLabelText('required')).toBeInTheDocument();
  });
  
  it('displays error with accessibility', () => {
    const WrappedTextField = withFieldWrapper(TextField);
    render(
      <WrappedTextField
        name="test"
        label="Test"
        error="Field is required"
      />
    );
    
    const error = screen.getByRole('alert');
    expect(error).toHaveTextContent('Field is required');
    
    const input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAttribute('aria-describedby', expect.stringContaining('error'));
  });
  
  it('handles onChange with proper typing', () => {
    const onChange = jest.fn();
    render(<TextField name="test" onChange={onChange} />);
    
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'test value' } });
    
    expect(onChange).toHaveBeenCalledWith('test value');
  });
});
```

#### 6.3 Test Template for Other Components
Create similar tests for all components covering:
- Rendering with props
- Accessibility attributes
- Event handling with proper types
- React Hook Form integration
- Error states

## Execution Plan

### Day 1: TypeScript Foundation
- [ ] Create types/events.ts
- [ ] Create types/shadcn.d.ts
- [ ] Update tsconfig
- [ ] Fix FieldProps interface
- [ ] Fix withFieldWrapper HOC
- [ ] Fix FieldFactory
- [ ] Run `npm run typecheck` - ensure 0 errors

### Day 2: Update Existing Components
- [ ] Update TextField with shadcn/ui
- [ ] Update NumberField
- [ ] Update TextAreaField
- [ ] Update SelectField
- [ ] Update CheckboxField
- [ ] Update DateField
- [ ] Test each component renders correctly

### Day 3-4: Create Missing Components
- [ ] RadioGroupField
- [ ] SliderField
- [ ] RatingField
- [ ] FileUploadField
- [ ] RepeaterField
- [ ] All specialized fields (8 components)
- [ ] Verify each with manual testing

### Day 5: Registry & Testing
- [ ] Update field registry with all components
- [ ] Create test setup
- [ ] Write tests for 5 core components
- [ ] Run full test suite
- [ ] Verify >80% coverage

### Validation Checklist
```bash
# After each day, run:
npm run lint        # No errors
npm run typecheck   # No errors
npm run test        # All pass
npm run build       # Successful
npm run size        # Bundle within limits

# Final validation
grep -r "React.ComponentType<any>" src/  # Should show proper typing
grep -r "onChange: unknown" src/          # Should return nothing
npm run test -- --coverage                # >80% coverage
```

## Success Metrics
- ✅ 0 TypeScript errors
- ✅ All 18 widget types registered
- ✅ All components use shadcn/ui primitives
- ✅ Full ARIA accessibility implementation
- ✅ withFieldWrapper applied in FieldFactory
- ✅ Component tests with >80% coverage
- ✅ Bundle size <150KB

## Risk Mitigation
1. **TypeScript errors persist**: Use temporary `any` types with TODO comments
2. **shadcn/ui integration issues**: Create mock components if needed
3. **Time constraints**: Prioritize core components first, specialized later
4. **Test coverage low**: Focus on critical path testing first

## Deliverables
1. Working field registry with all components
2. Zero TypeScript errors
3. Full accessibility implementation
4. Component test suite
5. Documentation of any deviations from plan

## Next Steps After Completion
1. Step 4: Validation Engine integration
2. Add Storybook stories for all components
3. Visual regression testing setup
4. Performance optimization pass
5. i18n support implementation