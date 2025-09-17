# Step 6: Form Renderer & Stepper

## Step Description
Build the dynamic form renderer that interprets schemas and renders appropriate fields, implement multi-step navigation with progress indicators, and create the form submission handling system.

## Prerequisites
- Step 5 (Rule Engine) completed  
- Field Registry populated with components
- Validation engine functional
- Visibility controller ready
- React Hook Form configured

## Detailed To-Do List

### 6.1 Form Renderer Core
```typescript
// src/renderer/FormRenderer.tsx

import { useForm, FormProvider, UseFormReturn } from 'react-hook-form';
import { createAjvResolver } from '@/validation/rhf-resolver';
import { FieldFactory } from '@/components/fields/FieldFactory';
import { VisibilityController } from '@/rules/visibility-controller';
import { ValidationEngine } from '@/validation/ajv-setup';
import { TransitionEngine } from '@/rules/transition-engine';

export interface FormRendererProps {
  schema: UnifiedFormSchema;
  initialData?: any;
  onSubmit: (data: any) => void | Promise<void>;
  onStepChange?: (stepId: string) => void;
  onFieldChange?: (field: string, value: any) => void;
  onValidationError?: (errors: any) => void;
  mode?: 'create' | 'edit' | 'view';
  className?: string;
}

export const FormRenderer: React.FC<FormRendererProps> = ({
  schema,
  initialData = {},
  onSubmit,
  onStepChange,
  onFieldChange,
  onValidationError,
  mode = 'create',
  className
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [stepHistory, setStepHistory] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const validationEngine = useRef(new ValidationEngine());
  const visibilityController = useRef(new VisibilityController());
  const transitionEngine = useRef(new TransitionEngine());
  
  // Get visible steps based on current data
  const visibleSteps = useMemo(() => {
    return visibilityController.current.getVisibleSteps(schema, watch());
  }, [schema, watch()]);
  
  const currentStep = visibleSteps[currentStepIndex];
  const currentStepConfig = schema.steps.find(s => s.id === currentStep);
  
  // Create form with validation
  const methods = useForm({
    defaultValues: initialData,
    resolver: currentStepConfig ? 
      createAjvResolver(
        resolveStepSchema(currentStepConfig, schema),
        validationEngine.current
      ) : undefined,
    mode: 'onChange',
    reValidateMode: 'onChange'
  });
  
  const { handleSubmit, watch, formState, setValue, getValues } = methods;
  
  // Watch for field changes
  useEffect(() => {
    const subscription = watch((value, { name }) => {
      if (name && onFieldChange) {
        onFieldChange(name, value[name]);
      }
      
      // Re-evaluate visibility rules
      visibilityController.current.clearCache();
    });
    
    return () => subscription.unsubscribe();
  }, [watch, onFieldChange]);
  
  // Handle step change
  useEffect(() => {
    if (currentStep && onStepChange) {
      onStepChange(currentStep);
    }
  }, [currentStep, onStepChange]);
  
  // Handle validation errors
  useEffect(() => {
    if (formState.errors && Object.keys(formState.errors).length > 0) {
      onValidationError?.(formState.errors);
    }
  }, [formState.errors, onValidationError]);
  
  const handleNext = async () => {
    // Validate current step
    const isValid = await methods.trigger();
    
    if (!isValid) {
      // Scroll to first error
      scrollToFirstError();
      return;
    }
    
    // Determine next step based on rules
    const nextStep = transitionEngine.current.getNextStep(
      schema,
      currentStep,
      getValues()
    );
    
    if (nextStep) {
      const nextIndex = visibleSteps.indexOf(nextStep);
      if (nextIndex !== -1) {
        setStepHistory([...stepHistory, currentStep]);
        setCurrentStepIndex(nextIndex);
      }
    } else if (currentStepIndex === visibleSteps.length - 1) {
      // Last step - submit
      await handleFormSubmit(getValues());
    }
  };
  
  const handlePrevious = () => {
    if (stepHistory.length > 0) {
      const previousStep = stepHistory[stepHistory.length - 1];
      const previousIndex = visibleSteps.indexOf(previousStep);
      
      if (previousIndex !== -1) {
        setStepHistory(stepHistory.slice(0, -1));
        setCurrentStepIndex(previousIndex);
      }
    }
  };
  
  const handleFormSubmit = async (data: any) => {
    setIsSubmitting(true);
    
    try {
      // Validate all steps
      const allStepsValid = await validateAllSteps(data);
      
      if (!allStepsValid) {
        // Show validation summary
        showValidationSummary();
        return;
      }
      
      // Add metadata
      const submissionData = {
        ...data,
        _meta: {
          schemaId: schema.$id,
          schemaVersion: schema.version,
          submittedAt: new Date().toISOString(),
          completedSteps: visibleSteps
        }
      };
      
      await onSubmit(submissionData);
    } catch (error) {
      console.error('Form submission error:', error);
      // Handle submission error
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const validateAllSteps = async (data: any): Promise<boolean> => {
    for (const step of visibleSteps) {
      const stepConfig = schema.steps.find(s => s.id === step);
      if (stepConfig) {
        const stepSchema = resolveStepSchema(stepConfig, schema);
        const result = await validationEngine.current.validate(stepSchema, data);
        
        if (!result.valid) {
          return false;
        }
      }
    }
    
    return true;
  };
  
  const renderStep = () => {
    if (!currentStepConfig) return null;
    
    const stepSchema = resolveStepSchema(currentStepConfig, schema);
    const visibleFields = visibilityController.current.getVisibleFields(
      schema,
      currentStep,
      watch()
    );
    
    return (
      <div className="space-y-4">
        {stepSchema.properties && Object.entries(stepSchema.properties).map(
          ([fieldName, fieldSchema]) => {
            if (!visibleFields.includes(fieldName)) {
              return null;
            }
            
            const uiConfig = schema.ui?.widgets?.[fieldName];
            
            if (!uiConfig) {
              console.warn(`No UI config for field: ${fieldName}`);
              return null;
            }
            
            return (
              <FieldFactory
                key={fieldName}
                type={uiConfig.component as WidgetType}
                fieldProps={{
                  name: fieldName,
                  label: uiConfig.label,
                  description: uiConfig.helpText,
                  placeholder: uiConfig.placeholder,
                  required: stepSchema.required?.includes(fieldName),
                  disabled: mode === 'view' || uiConfig.disabled,
                  readOnly: uiConfig.readOnly,
                  control: methods.control,
                  rules: fieldSchema,
                  ...uiConfig
                }}
              />
            );
          }
        )}
      </div>
    );
  };
  
  return (
    <FormProvider {...methods}>
      <form onSubmit={handleSubmit(handleFormSubmit)} className={className}>
        <div className="space-y-6">
          {/* Progress Indicator */}
          <StepProgress
            steps={visibleSteps.map(id => {
              const step = schema.steps.find(s => s.id === id);
              return {
                id,
                title: step?.title || id,
                status: getStepStatus(id, currentStep, stepHistory)
              };
            })}
            currentStep={currentStep}
          />
          
          {/* Step Content */}
          <Card>
            <CardHeader>
              <CardTitle>{currentStepConfig?.title}</CardTitle>
              {currentStepConfig?.description && (
                <CardDescription>{currentStepConfig.description}</CardDescription>
              )}
            </CardHeader>
            
            <CardContent>
              {renderStep()}
              
              {formState.errors && Object.keys(formState.errors).length > 0 && (
                <ErrorSummary errors={formState.errors} />
              )}
            </CardContent>
            
            <CardFooter className="flex justify-between">
              <Button
                type="button"
                variant="outline"
                onClick={handlePrevious}
                disabled={currentStepIndex === 0 || isSubmitting}
              >
                Previous
              </Button>
              
              <div className="flex gap-2">
                {currentStepIndex < visibleSteps.length - 1 ? (
                  <Button
                    type="button"
                    onClick={handleNext}
                    disabled={isSubmitting}
                  >
                    Next
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Submitting...' : 'Submit'}
                  </Button>
                )}
              </div>
            </CardFooter>
          </Card>
        </div>
      </form>
    </FormProvider>
  );
};
```

### 6.2 Step Progress Component
```typescript
// src/renderer/StepProgress.tsx

interface StepProgressProps {
  steps: Array<{
    id: string;
    title: string;
    status: 'completed' | 'current' | 'upcoming' | 'error';
  }>;
  currentStep: string;
  orientation?: 'horizontal' | 'vertical';
  showLabels?: boolean;
}

export const StepProgress: React.FC<StepProgressProps> = ({
  steps,
  currentStep,
  orientation = 'horizontal',
  showLabels = true
}) => {
  const isHorizontal = orientation === 'horizontal';
  
  return (
    <div
      className={cn(
        'flex',
        isHorizontal ? 'flex-row items-center' : 'flex-col'
      )}
      role="navigation"
      aria-label="Form progress"
    >
      {steps.map((step, index) => {
        const isLast = index === steps.length - 1;
        
        return (
          <div
            key={step.id}
            className={cn(
              'flex',
              isHorizontal ? 'flex-row items-center' : 'flex-col'
            )}
          >
            <StepIndicator
              number={index + 1}
              status={step.status}
              title={step.title}
              showLabel={showLabels}
              isActive={step.id === currentStep}
            />
            
            {!isLast && (
              <StepConnector
                orientation={orientation}
                isCompleted={step.status === 'completed'}
              />
            )}
          </div>
        );
      })}
    </div>
  );
};

const StepIndicator: React.FC<{
  number: number;
  status: 'completed' | 'current' | 'upcoming' | 'error';
  title: string;
  showLabel: boolean;
  isActive: boolean;
}> = ({ number, status, title, showLabel, isActive }) => {
  const getIcon = () => {
    switch (status) {
      case 'completed':
        return <Check className="h-4 w-4" />;
      case 'error':
        return <X className="h-4 w-4" />;
      default:
        return number;
    }
  };
  
  return (
    <div className="flex flex-col items-center">
      <div
        className={cn(
          'flex h-10 w-10 items-center justify-center rounded-full border-2',
          {
            'border-primary bg-primary text-primary-foreground': status === 'current',
            'border-primary bg-primary text-primary-foreground': status === 'completed',
            'border-muted-foreground bg-background': status === 'upcoming',
            'border-destructive bg-destructive text-destructive-foreground': status === 'error',
            'ring-2 ring-primary ring-offset-2': isActive
          }
        )}
        aria-current={isActive ? 'step' : undefined}
      >
        {getIcon()}
      </div>
      
      {showLabel && (
        <span
          className={cn(
            'mt-2 text-sm',
            isActive ? 'font-semibold' : 'font-normal',
            status === 'upcoming' && 'text-muted-foreground'
          )}
        >
          {title}
        </span>
      )}
    </div>
  );
};

const StepConnector: React.FC<{
  orientation: 'horizontal' | 'vertical';
  isCompleted: boolean;
}> = ({ orientation, isCompleted }) => {
  const isHorizontal = orientation === 'horizontal';
  
  return (
    <div
      className={cn(
        'transition-colors',
        isHorizontal ? 'h-0.5 w-12 mx-2' : 'w-0.5 h-12 my-2',
        isCompleted ? 'bg-primary' : 'bg-muted-foreground/25'
      )}
      role="presentation"
    />
  );
};
```

### 6.3 Error Summary Component
```typescript
// src/renderer/ErrorSummary.tsx

interface ErrorSummaryProps {
  errors: FieldErrors;
  onErrorClick?: (fieldName: string) => void;
}

export const ErrorSummary: React.FC<ErrorSummaryProps> = ({
  errors,
  onErrorClick
}) => {
  const errorList = Object.entries(errors).map(([field, error]) => ({
    field,
    message: typeof error === 'string' ? error : error?.message || 'Invalid value'
  }));
  
  if (errorList.length === 0) return null;
  
  const handleErrorClick = (fieldName: string) => {
    // Scroll to and focus the field
    const fieldElement = document.querySelector(`[name="${fieldName}"]`);
    if (fieldElement) {
      fieldElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      (fieldElement as HTMLElement).focus();
    }
    onErrorClick?.(fieldName);
  };
  
  return (
    <Alert variant="destructive" className="mt-4">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Please correct the following errors:</AlertTitle>
      <AlertDescription>
        <ul className="mt-2 space-y-1">
          {errorList.map(({ field, message }) => (
            <li key={field}>
              <button
                type="button"
                onClick={() => handleErrorClick(field)}
                className="text-left hover:underline focus:outline-none focus:underline"
              >
                <span className="font-medium">{field}:</span> {message}
              </button>
            </li>
          ))}
        </ul>
      </AlertDescription>
    </Alert>
  );
};
```

### 6.4 Form Context Provider
```typescript
// src/renderer/FormContext.tsx

interface FormContextValue {
  schema: UnifiedFormSchema;
  currentStep: string;
  formData: any;
  isDirty: boolean;
  isSubmitting: boolean;
  validationErrors: FieldErrors;
  visibleFields: string[];
  visibleSteps: string[];
  canGoNext: boolean;
  canGoPrevious: boolean;
  goToStep: (stepId: string) => void;
  updateField: (field: string, value: any) => void;
  validateField: (field: string) => Promise<boolean>;
  validateStep: (stepId?: string) => Promise<boolean>;
  submit: () => Promise<void>;
}

const FormContext = React.createContext<FormContextValue | null>(null);

export const useFormContext = () => {
  const context = useContext(FormContext);
  if (!context) {
    throw new Error('useFormContext must be used within FormProvider');
  }
  return context;
};

export const FormContextProvider: React.FC<{
  children: React.ReactNode;
  schema: UnifiedFormSchema;
  initialData?: any;
  onSubmit: (data: any) => Promise<void>;
}> = ({ children, schema, initialData = {}, onSubmit }) => {
  const [formData, setFormData] = useState(initialData);
  const [currentStep, setCurrentStep] = useState(schema.steps[0]?.id || '');
  const [validationErrors, setValidationErrors] = useState<FieldErrors>({});
  const [isDirty, setIsDirty] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const validationEngine = useRef(new ValidationEngine());
  const visibilityController = useRef(new VisibilityController());
  const transitionEngine = useRef(new TransitionEngine());
  
  const visibleSteps = useMemo(() => {
    return visibilityController.current.getVisibleSteps(schema, formData);
  }, [schema, formData]);
  
  const visibleFields = useMemo(() => {
    return visibilityController.current.getVisibleFields(schema, currentStep, formData);
  }, [schema, currentStep, formData]);
  
  const canGoNext = useMemo(() => {
    const currentIndex = visibleSteps.indexOf(currentStep);
    return currentIndex < visibleSteps.length - 1;
  }, [currentStep, visibleSteps]);
  
  const canGoPrevious = useMemo(() => {
    const currentIndex = visibleSteps.indexOf(currentStep);
    return currentIndex > 0;
  }, [currentStep, visibleSteps]);
  
  const updateField = useCallback((field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    setIsDirty(true);
    
    // Clear field error
    setValidationErrors(prev => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }, []);
  
  const validateField = useCallback(async (field: string): Promise<boolean> => {
    const stepConfig = schema.steps.find(s => s.id === currentStep);
    if (!stepConfig) return true;
    
    const stepSchema = resolveStepSchema(stepConfig, schema);
    const fieldSchema = stepSchema.properties?.[field];
    
    if (!fieldSchema) return true;
    
    const result = await validationEngine.current.validate(
      { 
        type: 'object',
        properties: { [field]: fieldSchema },
        required: stepSchema.required?.includes(field) ? [field] : []
      },
      { [field]: formData[field] }
    );
    
    if (!result.valid) {
      setValidationErrors(prev => ({
        ...prev,
        [field]: result.errors[0]?.message || 'Invalid value'
      }));
    }
    
    return result.valid;
  }, [schema, currentStep, formData]);
  
  const validateStep = useCallback(async (stepId?: string): Promise<boolean> => {
    const step = stepId || currentStep;
    const stepConfig = schema.steps.find(s => s.id === step);
    
    if (!stepConfig) return true;
    
    const stepSchema = resolveStepSchema(stepConfig, schema);
    const result = await validationEngine.current.validate(stepSchema, formData);
    
    if (!result.valid) {
      const errors: FieldErrors = {};
      result.errors.forEach(error => {
        const field = error.property || error.path.replace(/^\//, '');
        if (field) {
          errors[field] = error.message;
        }
      });
      setValidationErrors(errors);
    }
    
    return result.valid;
  }, [schema, currentStep, formData]);
  
  const goToStep = useCallback(async (stepId: string) => {
    // Validate current step before moving
    const isValid = await validateStep();
    if (!isValid && visibleSteps.indexOf(stepId) > visibleSteps.indexOf(currentStep)) {
      // Don't allow forward navigation with errors
      return;
    }
    
    setCurrentStep(stepId);
  }, [currentStep, visibleSteps, validateStep]);
  
  const submit = useCallback(async () => {
    setIsSubmitting(true);
    
    try {
      // Validate all visible steps
      for (const stepId of visibleSteps) {
        const isValid = await validateStep(stepId);
        if (!isValid) {
          setCurrentStep(stepId);
          throw new Error('Validation failed');
        }
      }
      
      const submissionData = {
        ...formData,
        _meta: {
          schemaId: schema.$id,
          schemaVersion: schema.version,
          submittedAt: new Date().toISOString(),
          completedSteps: visibleSteps
        }
      };
      
      await onSubmit(submissionData);
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, schema, visibleSteps, validateStep, onSubmit]);
  
  const value: FormContextValue = {
    schema,
    currentStep,
    formData,
    isDirty,
    isSubmitting,
    validationErrors,
    visibleFields,
    visibleSteps,
    canGoNext,
    canGoPrevious,
    goToStep,
    updateField,
    validateField,
    validateStep,
    submit
  };
  
  return (
    <FormContext.Provider value={value}>
      {children}
    </FormContext.Provider>
  );
};
```

### 6.5 Advanced Form Features
```typescript
// src/renderer/FormFeatures.tsx

// Auto-save indicator
export const AutoSaveIndicator: React.FC<{
  lastSaved?: Date;
  isSaving?: boolean;
}> = ({ lastSaved, isSaving }) => {
  if (isSaving) {
    return (
      <div className="flex items-center text-sm text-muted-foreground">
        <Loader2 className="mr-2 h-3 w-3 animate-spin" />
        Saving...
      </div>
    );
  }
  
  if (lastSaved) {
    return (
      <div className="text-sm text-muted-foreground">
        Last saved {formatDistanceToNow(lastSaved, { addSuffix: true })}
      </div>
    );
  }
  
  return null;
};

// Step navigation with keyboard shortcuts
export const useStepNavigation = () => {
  const { goToStep, canGoNext, canGoPrevious, currentStep, visibleSteps } = useFormContext();
  
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Alt + Arrow navigation
      if (e.altKey) {
        if (e.key === 'ArrowRight' && canGoNext) {
          e.preventDefault();
          const currentIndex = visibleSteps.indexOf(currentStep);
          goToStep(visibleSteps[currentIndex + 1]);
        } else if (e.key === 'ArrowLeft' && canGoPrevious) {
          e.preventDefault();
          const currentIndex = visibleSteps.indexOf(currentStep);
          goToStep(visibleSteps[currentIndex - 1]);
        }
      }
      
      // Ctrl/Cmd + Enter to submit
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        document.querySelector<HTMLFormElement>('form')?.requestSubmit();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [canGoNext, canGoPrevious, currentStep, visibleSteps, goToStep]);
};

// Field focus management
export const useFieldFocus = () => {
  const focusFirstError = useCallback(() => {
    const firstError = document.querySelector('[aria-invalid="true"]');
    if (firstError) {
      (firstError as HTMLElement).focus();
      firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, []);
  
  const focusField = useCallback((fieldName: string) => {
    const field = document.querySelector(`[name="${fieldName}"]`);
    if (field) {
      (field as HTMLElement).focus();
      field.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, []);
  
  return { focusFirstError, focusField };
};

// Form submission handler with retry
export const useFormSubmission = (
  onSubmit: (data: any) => Promise<void>,
  options?: {
    maxRetries?: number;
    retryDelay?: number;
  }
) => {
  const [submissionState, setSubmissionState] = useState<{
    isSubmitting: boolean;
    error?: Error;
    attempts: number;
  }>({
    isSubmitting: false,
    attempts: 0
  });
  
  const submit = useCallback(async (data: any) => {
    const maxRetries = options?.maxRetries ?? 3;
    const retryDelay = options?.retryDelay ?? 1000;
    
    setSubmissionState({ isSubmitting: true, attempts: 0 });
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        await onSubmit(data);
        setSubmissionState({ isSubmitting: false, attempts: attempt });
        return;
      } catch (error) {
        console.error(`Submission attempt ${attempt} failed:`, error);
        
        if (attempt === maxRetries) {
          setSubmissionState({
            isSubmitting: false,
            error: error as Error,
            attempts: attempt
          });
          throw error;
        }
        
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, retryDelay * attempt));
      }
    }
  }, [onSubmit, options]);
  
  return { submit, ...submissionState };
};
```

### 6.6 Form Utilities
```typescript
// src/renderer/utils.ts

export function resolveStepSchema(
  step: FormStep,
  schema: UnifiedFormSchema
): JSONSchema {
  if ('$ref' in step.schema) {
    const refPath = step.schema.$ref.replace('#/', '').split('/');
    let resolved: any = schema;
    
    for (const part of refPath) {
      resolved = resolved[part];
      if (!resolved) {
        throw new Error(`Invalid $ref: ${step.schema.$ref}`);
      }
    }
    
    return resolved;
  }
  
  return step.schema;
}

export function getStepStatus(
  stepId: string,
  currentStep: string,
  completedSteps: string[]
): 'completed' | 'current' | 'upcoming' | 'error' {
  if (stepId === currentStep) return 'current';
  if (completedSteps.includes(stepId)) return 'completed';
  return 'upcoming';
}

export function extractFormData(
  data: any,
  schema: UnifiedFormSchema,
  options?: {
    includeHidden?: boolean;
    includeComputed?: boolean;
    stripMeta?: boolean;
  }
): any {
  const result = { ...data };
  
  // Remove hidden fields unless specified
  if (!options?.includeHidden) {
    const visibilityController = new VisibilityController();
    schema.steps.forEach(step => {
      const visibleFields = visibilityController.getVisibleFields(
        schema,
        step.id,
        data
      );
      
      const stepSchema = resolveStepSchema(step, schema);
      if (stepSchema.properties) {
        Object.keys(stepSchema.properties).forEach(field => {
          if (!visibleFields.includes(field)) {
            delete result[field];
          }
        });
      }
    });
  }
  
  // Remove computed fields unless specified
  if (!options?.includeComputed && schema.computed) {
    schema.computed.forEach(computed => {
      const path = computed.path.replace('$.', '');
      delete result[path];
    });
  }
  
  // Strip metadata
  if (options?.stripMeta !== false) {
    delete result._meta;
  }
  
  return result;
}

export function scrollToFirstError(): void {
  const firstError = document.querySelector('[aria-invalid="true"]');
  if (firstError) {
    firstError.scrollIntoView({ 
      behavior: 'smooth', 
      block: 'center' 
    });
    (firstError as HTMLElement).focus();
  }
}

export function showValidationSummary(): void {
  // Create and show validation summary modal or toast
  const errors = document.querySelectorAll('[aria-invalid="true"]');
  const errorMessages: string[] = [];
  
  errors.forEach((element) => {
    const label = element.getAttribute('aria-label') || element.getAttribute('name');
    const message = element.getAttribute('aria-describedby');
    if (label) {
      errorMessages.push(`${label}: ${message || 'Invalid value'}`);
    }
  });
  
  if (errorMessages.length > 0) {
    // Show toast or modal with error messages
    console.error('Validation errors:', errorMessages);
  }
}
```

## Test Cases

### Form Renderer Tests
```typescript
describe('Form Renderer', () => {
  const mockSchema: UnifiedFormSchema = {
    $id: 'test-form',
    version: '1.0.0',
    metadata: {
      title: 'Test Form',
      description: 'Test form description',
      sensitivity: 'low'
    },
    steps: [
      {
        id: 'personal',
        title: 'Personal Info',
        schema: {
          type: 'object',
          properties: {
            firstName: { type: 'string', minLength: 1 },
            lastName: { type: 'string', minLength: 1 }
          },
          required: ['firstName', 'lastName']
        }
      },
      {
        id: 'contact',
        title: 'Contact Info',
        schema: {
          type: 'object',
          properties: {
            email: { type: 'string', format: 'email' },
            phone: { type: 'string', format: 'phone' }
          },
          required: ['email']
        }
      }
    ],
    transitions: [
      { from: 'personal', to: 'contact', default: true }
    ],
    ui: {
      widgets: {
        firstName: { component: 'Text', label: 'First Name' },
        lastName: { component: 'Text', label: 'Last Name' },
        email: { component: 'Email', label: 'Email' },
        phone: { component: 'Phone', label: 'Phone' }
      }
    }
  };
  
  it('should render first step initially', () => {
    const { getByLabelText } = render(
      <FormRenderer
        schema={mockSchema}
        onSubmit={jest.fn()}
      />
    );
    
    expect(getByLabelText('First Name')).toBeInTheDocument();
    expect(getByLabelText('Last Name')).toBeInTheDocument();
  });
  
  it('should navigate between steps', async () => {
    const { getByText, getByLabelText } = render(
      <FormRenderer
        schema={mockSchema}
        onSubmit={jest.fn()}
      />
    );
    
    // Fill required fields
    fireEvent.change(getByLabelText('First Name'), {
      target: { value: 'John' }
    });
    fireEvent.change(getByLabelText('Last Name'), {
      target: { value: 'Doe' }
    });
    
    // Click next
    fireEvent.click(getByText('Next'));
    
    // Should show second step
    await waitFor(() => {
      expect(getByLabelText('Email')).toBeInTheDocument();
    });
  });
  
  it('should validate on step change', async () => {
    const { getByText, getByRole } = render(
      <FormRenderer
        schema={mockSchema}
        onSubmit={jest.fn()}
      />
    );
    
    // Try to go next without filling required fields
    fireEvent.click(getByText('Next'));
    
    // Should show validation errors
    await waitFor(() => {
      expect(getByRole('alert')).toBeInTheDocument();
    });
  });
  
  it('should submit form data', async () => {
    const onSubmit = jest.fn();
    const { getByText, getByLabelText } = render(
      <FormRenderer
        schema={mockSchema}
        onSubmit={onSubmit}
      />
    );
    
    // Fill all required fields
    fireEvent.change(getByLabelText('First Name'), {
      target: { value: 'John' }
    });
    fireEvent.change(getByLabelText('Last Name'), {
      target: { value: 'Doe' }
    });
    
    fireEvent.click(getByText('Next'));
    
    await waitFor(() => {
      fireEvent.change(getByLabelText('Email'), {
        target: { value: 'john@example.com' }
      });
    });
    
    fireEvent.click(getByText('Submit'));
    
    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          _meta: expect.objectContaining({
            schemaId: 'test-form',
            schemaVersion: '1.0.0'
          })
        })
      );
    });
  });
  
  it('should handle step visibility conditions', () => {
    const conditionalSchema = {
      ...mockSchema,
      steps: [
        ...mockSchema.steps,
        {
          id: 'conditional',
          title: 'Conditional Step',
          schema: { type: 'object', properties: {} },
          visibleWhen: {
            op: 'eq',
            left: '$.showConditional',
            right: true
          }
        }
      ]
    };
    
    const { rerender } = render(
      <FormRenderer
        schema={conditionalSchema}
        initialData={{ showConditional: false }}
        onSubmit={jest.fn()}
      />
    );
    
    // Step should not be visible initially
    expect(queryByText('Conditional Step')).not.toBeInTheDocument();
    
    // Update data to show step
    rerender(
      <FormRenderer
        schema={conditionalSchema}
        initialData={{ showConditional: true }}
        onSubmit={jest.fn()}
      />
    );
    
    // Step should now be visible
    expect(getByText('Conditional Step')).toBeInTheDocument();
  });
});
```

## Success Criteria
- ✅ Dynamic form rendering from schema
- ✅ Multi-step navigation with validation
- ✅ Progress indicator showing step status
- ✅ Field visibility based on rules
- ✅ Form submission with metadata
- ✅ Error summary with field navigation
- ✅ Keyboard navigation support
- ✅ Responsive design for mobile/desktop

## Implementation Notes

### Performance Optimizations
- Memoize visible fields/steps calculations
- Lazy load step content
- Debounce field change handlers
- Virtual scrolling for long forms
- Use React.memo for field components

### Accessibility Features
- ARIA labels and roles on all interactive elements
- Keyboard navigation with Tab/Shift+Tab
- Screen reader announcements for step changes
- Focus management on error/navigation
- Error associations with aria-describedby

### User Experience
- Smooth transitions between steps
- Clear, actionable error messages
- Progress saving indicator
- Confirmation before data loss
- Mobile-optimized touch targets
- Loading states during submission

### Security Considerations
- Sanitize all user inputs
- Validate on both client and server
- Rate limit form submissions
- CSRF protection for submissions
- XSS prevention in rendered content

## Next Steps
With form renderer complete:
1. Implement data persistence and autosave (Step 7)
2. Add form preview mode for testing
3. Create form submission queue for offline support
4. Build form analytics dashboard
5. Add print/PDF export functionality
6. Implement form versioning UI