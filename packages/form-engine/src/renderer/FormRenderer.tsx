'use client';

import * as React from 'react';
import { FormProvider, useForm } from 'react-hook-form';

import { FieldFactory } from '../components/fields/FieldFactory';
import type { JSONSchema, UnifiedFormSchema, ValidationError, WidgetType } from '../types';
import { ValidationEngine } from '../validation/ajv-setup';
import { TransitionEngine } from '../rules/transition-engine';
import { VisibilityController } from '../rules/visibility-controller';

export interface FormRendererProps {
  schema: UnifiedFormSchema;
  initialData?: Record<string, unknown>;
  onSubmit: (data: any) => void | Promise<void>;
  onStepChange?: (stepId: string) => void;
  onFieldChange?: (field: string, value: unknown) => void;
  onValidationError?: (errors: unknown) => void;
  mode?: 'create' | 'edit' | 'view';
  className?: string;
}

function resolveStepSchema(step: UnifiedFormSchema['steps'][number], formSchema: UnifiedFormSchema): JSONSchema {
  if ('$ref' in step.schema) {
    if (!step.schema.$ref) {
      throw new Error('Step schema $ref is missing');
    }
    const reference = step.schema.$ref.replace('#/definitions/', '');
    const resolved = formSchema.definitions?.[reference];
    if (!resolved) {
      throw new Error(`Unable to resolve schema reference: ${step.schema.$ref}`);
    }
    return resolved;
  }
  return step.schema;
}

function extractFields(stepSchema: JSONSchema, formSchema: UnifiedFormSchema) {
  const properties = stepSchema.properties ?? {};
  return Object.entries(properties).map(([name, propertySchema]) => {
    const widgetConfig = formSchema.ui.widgets[name];
    const widget: WidgetType = widgetConfig?.component ?? 'Text';
    return {
      name,
      schema: propertySchema,
      widget,
      widgetConfig
    };
  });
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
  const validationEngineRef = React.useRef(new ValidationEngine());
  const visibilityControllerRef = React.useRef(new VisibilityController());
  const transitionEngineRef = React.useRef(new TransitionEngine());

  const [currentStepIndex, setCurrentStepIndex] = React.useState(0);
  const [stepHistory, setStepHistory] = React.useState<string[]>([]);
  const [isSubmitting, setSubmitting] = React.useState(false);

  const methods = useForm({
    defaultValues: initialData,
    mode: 'onChange',
    reValidateMode: 'onChange'
  });

  const watchedValues = methods.watch();

  const visibleSteps = React.useMemo(() => {
    return visibilityControllerRef.current.getVisibleSteps(schema, watchedValues);
  }, [schema, watchedValues]);

  const currentStepId = visibleSteps[currentStepIndex] ?? visibleSteps[0];
  const currentStepConfig = schema.steps.find(step => step.id === currentStepId);
  const currentStepSchema = currentStepConfig ? resolveStepSchema(currentStepConfig, schema) : undefined;

  React.useEffect(() => {
    if (currentStepConfig && onStepChange) {
      onStepChange(currentStepConfig.id);
    }
  }, [currentStepConfig, onStepChange]);

  React.useEffect(() => {
    const subscription = methods.watch((values, { name }) => {
      if (name && onFieldChange) {
        onFieldChange(name, values?.[name as keyof typeof values]);
      }
      visibilityControllerRef.current.clearCache();
    });
    return () => subscription.unsubscribe();
  }, [methods, onFieldChange]);

  React.useEffect(() => {
    if (methods.formState.errors && Object.keys(methods.formState.errors).length > 0) {
      onValidationError?.(methods.formState.errors);
    }
  }, [methods.formState.errors, onValidationError]);

  const applyValidationErrors = (errors: ValidationError[]) => {
    methods.clearErrors();
    errors.forEach(error => {
      const path = error.path.replace(/^\//, '').replace(/\//g, '.');
      const name = (path || error.property || '').trim();
      if (!name) return;
      methods.setError(name as any, {
        type: error.keyword || 'manual',
        message: error.message
      });
    });
  };

  const validateCurrentStep = async () => {
    if (!currentStepSchema) return true;
    const result = await validationEngineRef.current.validate(currentStepSchema, methods.getValues());
    if (!result.valid) {
      applyValidationErrors(result.errors);
      return false;
    }
    methods.clearErrors();
    return true;
  };

  const handleNext = async () => {
    if (!currentStepSchema || !currentStepConfig) return;
    const isValid = await validateCurrentStep();
    if (!isValid) {
      return;
    }
    const nextStep = transitionEngineRef.current.getNextStep(schema, currentStepConfig.id, methods.getValues());
    if (!nextStep) {
      if (currentStepIndex === visibleSteps.length - 1) {
        await submitForm(methods.getValues());
      }
      return;
    }
    const nextIndex = visibleSteps.indexOf(nextStep);
    if (nextIndex >= 0) {
      setStepHistory(history => [...history, currentStepConfig.id]);
      setCurrentStepIndex(nextIndex);
    }
  };

  const handlePrevious = () => {
    const previousStep = stepHistory[stepHistory.length - 1];
    if (!previousStep) return;
    const previousIndex = visibleSteps.indexOf(previousStep);
    if (previousIndex >= 0) {
      setStepHistory(history => history.slice(0, -1));
      setCurrentStepIndex(previousIndex);
    }
  };

  const validateAllSteps = async (data: Record<string, unknown>) => {
    for (const step of schema.steps) {
      const stepSchema = resolveStepSchema(step, schema);
      const result = await validationEngineRef.current.validate(stepSchema, data);
      if (!result.valid) {
        return false;
      }
    }
    return true;
  };

  const submitForm = async (data: Record<string, unknown>) => {
    const currentValid = await validateCurrentStep();
    if (!currentValid) {
      return;
    }
    setSubmitting(true);
    try {
      const isValid = await validateAllSteps(data);
      if (!isValid) {
        onValidationError?.({ message: 'Validation failed' });
        return;
      }
      await onSubmit({
        ...data,
        metadata: {
          submittedAt: new Date().toISOString(),
          schemaVersion: schema.version
        }
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (!currentStepSchema || !currentStepConfig) {
    return null;
  }

  const fields = extractFields(currentStepSchema, schema).filter(field =>
    visibilityControllerRef.current.isFieldVisible(field.schema, watchedValues)
  );

  return (
    <FormProvider {...methods}>
      <form className={className} onSubmit={methods.handleSubmit(submitForm)}>
        <div className="space-y-6">
          <header className="space-y-1">
            <h2 className="text-lg font-semibold">{currentStepConfig.title}</h2>
            {currentStepConfig.description ? (
              <p className="text-sm text-muted-foreground">{currentStepConfig.description}</p>
            ) : null}
          </header>

          <div className="space-y-4">
            {fields.map(field => {
              const widgetConfig = field.widgetConfig || {};
              return (
                <FieldFactory
                  key={field.name}
                  name={field.name}
                  label={widgetConfig.label ?? field.name}
                  widget={field.widget}
                  placeholder={widgetConfig.placeholder}
                  description={widgetConfig.description}
                  helpText={widgetConfig.helpText}
                  className={widgetConfig.className as string | undefined}
                  disabled={mode === 'view' || widgetConfig.disabled}
                  readOnly={widgetConfig.readOnly}
                  control={methods.control}
                  rules={undefined}
                  options={widgetConfig.options}
                />
              );
            })}
          </div>

          <footer className="flex items-center justify-between gap-4">
            <button type="button" onClick={handlePrevious} disabled={stepHistory.length === 0} className="rounded border px-4 py-2">
              Previous
            </button>
            {currentStepIndex < visibleSteps.length - 1 ? (
              <button type="button" onClick={handleNext} className="rounded bg-primary px-4 py-2 text-primary-foreground">
                Next
              </button>
            ) : (
              <button type="submit" disabled={isSubmitting} className="rounded bg-primary px-4 py-2 text-primary-foreground">
                {isSubmitting ? 'Submitting…' : 'Submit'}
              </button>
            )}
          </footer>
        </div>
      </form>
    </FormProvider>
  );
};
