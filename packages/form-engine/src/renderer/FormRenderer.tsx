'use client';

import * as React from 'react';
import { FormProvider, useForm } from 'react-hook-form';

import { FieldFactory } from '../components/fields/FieldFactory';
import type { JSONSchema, UnifiedFormSchema, ValidationError, WidgetType } from '../types';
import { TransitionEngine } from '../rules/transition-engine';
import { VisibilityController } from '../rules/visibility-controller';
import { ValidationEngine } from '../validation/ajv-setup';
import { createAjvResolver } from '../validation/rhf-resolver';
import { cn } from '../utils/cn';

import { ErrorSummary } from './ErrorSummary';
import { StepProgress } from './StepProgress';
import {
  flattenFieldErrors,
  getStepFieldNames,
  getStepStatus,
  resolveStepSchema,
  scrollToFirstError,
} from './utils';

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

type StepValidationResult = {
  valid: boolean;
  failedStep?: string;
};

export const FormRenderer: React.FC<FormRendererProps> = ({
  schema,
  initialData,
  onSubmit,
  onStepChange,
  onFieldChange,
  onValidationError,
  mode = 'create',
  className,
}) => {
  const fallbackInitialDataRef = React.useRef<Record<string, unknown>>({});
  const resolvedInitialData = initialData ?? fallbackInitialDataRef.current;
  const validationEngineRef = React.useRef(new ValidationEngine());
  const visibilityControllerRef = React.useRef(new VisibilityController());
  const transitionEngineRef = React.useRef(new TransitionEngine());
  const currentStepSchemaRef = React.useRef<JSONSchema | undefined>(undefined);

  const [currentStepIndex, setCurrentStepIndex] = React.useState(0);
  const [stepHistory, setStepHistory] = React.useState<string[]>([]);
  const [completedSteps, setCompletedSteps] = React.useState<string[]>([]);
  const [errorSteps, setErrorSteps] = React.useState<string[]>([]);
  const [isSubmitting, setSubmitting] = React.useState(false);

  const resolver = React.useCallback(
    async (values: Record<string, unknown>, context: any, options: any) => {
      const schemaForStep = currentStepSchemaRef.current;
      if (!schemaForStep) {
        return {
          values,
          errors: {},
        };
      }

      const stepResolver = createAjvResolver(schemaForStep, validationEngineRef.current);
      return stepResolver(values, context, options);
    },
    [],
  );

  const methods = useForm({
    defaultValues: resolvedInitialData,
    resolver,
    mode: 'onChange',
    reValidateMode: 'onChange',
    shouldUnregister: false,
  });

  const { reset } = methods;

  React.useEffect(() => {
    reset(resolvedInitialData, {
      keepDirty: false,
      keepErrors: false,
      keepDefaultValues: false,
    });
  }, [reset, resolvedInitialData]);

  const watchedValues = methods.watch();

  const visibleSteps = React.useMemo(() => {
    return visibilityControllerRef.current.getVisibleSteps(schema, watchedValues);
  }, [schema, watchedValues]);

  const sanitizedStepHistory = React.useMemo(
    () => stepHistory.filter((step) => visibleSteps.includes(step)),
    [stepHistory, visibleSteps],
  );
  React.useEffect(() => {
    if (sanitizedStepHistory.length !== stepHistory.length) {
      setStepHistory(sanitizedStepHistory);
    }
  }, [sanitizedStepHistory, stepHistory]);

  React.useEffect(() => {
    setCompletedSteps((prev) => prev.filter((step) => visibleSteps.includes(step)));
  }, [visibleSteps]);

  React.useEffect(() => {
    setErrorSteps((prev) => prev.filter((step) => visibleSteps.includes(step)));
  }, [visibleSteps]);

  const currentStepId = visibleSteps[currentStepIndex] ?? visibleSteps[0];
  const currentStepConfig = schema.steps.find((step) => step.id === currentStepId);
  const currentStepSchema = currentStepConfig
    ? resolveStepSchema(currentStepConfig, schema)
    : undefined;
  currentStepSchemaRef.current = currentStepSchema;

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

  React.useEffect(() => {
    if (currentStepIndex >= visibleSteps.length && visibleSteps.length > 0) {
      setCurrentStepIndex(visibleSteps.length - 1);
    }
  }, [currentStepIndex, visibleSteps]);

  const stepFieldMap = React.useMemo(() => {
    return new Map(schema.steps.map((step) => [step.id, new Set(getStepFieldNames(step, schema))]));
  }, [schema]);

  const stepErrorsFromState = React.useMemo(() => {
    const flattened = flattenFieldErrors(methods.formState.errors);
    const stepsWithErrors = new Set<string>();
    flattened.forEach(({ name }) => {
      const rootField = name.split('.')[0];
      if (!rootField) {
        return;
      }
      for (const [stepId, fields] of stepFieldMap.entries()) {
        if (fields.has(rootField)) {
          stepsWithErrors.add(stepId);
          break;
        }
      }
    });
    return Array.from(stepsWithErrors);
  }, [methods.formState.errors, stepFieldMap]);

  React.useEffect(() => {
    setErrorSteps((prev) => {
      const unique = Array.from(new Set(stepErrorsFromState));
      if (unique.length === prev.length && unique.every((step) => prev.includes(step))) {
        return prev;
      }
      return unique;
    });
  }, [stepErrorsFromState]);

  const errorStepSet = React.useMemo(() => new Set(errorSteps), [errorSteps]);

  const applyValidationErrors = React.useCallback(
    (errors: ValidationError[]) => {
      methods.clearErrors();
      errors.forEach((error) => {
        const path = error.path.replace(/^\//, '').replace(/\//g, '.');
        const name = (path || error.property || '').trim();
        if (!name) return;
        methods.setError(name as any, {
          type: error.keyword || 'manual',
          message: error.message,
        });
      });
    },
    [methods],
  );

  const markStepError = React.useCallback((stepId: string) => {
    setErrorSteps((prev) => (prev.includes(stepId) ? prev : [...prev, stepId]));
  }, []);

  const clearStepError = React.useCallback((stepId: string) => {
    setErrorSteps((prev) => prev.filter((item) => item !== stepId));
  }, []);

  const validateCurrentStep = React.useCallback(async () => {
    if (!currentStepSchema || !currentStepId) {
      return true;
    }
    const stepFields = Object.keys(currentStepSchema.properties ?? {});
    const isValid = await methods.trigger(stepFields as any, { shouldFocus: false });
    if (isValid) {
      clearStepError(currentStepId);
    } else {
      markStepError(currentStepId);
    }
    return isValid;
  }, [clearStepError, currentStepId, currentStepSchema, markStepError, methods]);

  const validateAllSteps = React.useCallback(
    async (data: Record<string, unknown>): Promise<StepValidationResult> => {
      for (const stepId of visibleSteps) {
        const stepConfig = schema.steps.find((step) => step.id === stepId);
        if (!stepConfig) {
          continue;
        }
        const stepSchema = resolveStepSchema(stepConfig, schema);
        const result = await validationEngineRef.current.validate(stepSchema, data);
        if (!result.valid) {
          applyValidationErrors(result.errors);
          markStepError(stepConfig.id);
          return { valid: false, failedStep: stepConfig.id };
        }
        clearStepError(stepConfig.id);
      }
      return { valid: true };
    },
    [applyValidationErrors, clearStepError, markStepError, schema, visibleSteps],
  );

  const handleFormSubmit = React.useCallback(
    async (data: Record<string, unknown>) => {
      setSubmitting(true);
      try {
        const { valid, failedStep } = await validateAllSteps(data);
        if (!valid) {
          if (failedStep) {
            const failedIndex = visibleSteps.indexOf(failedStep);
            if (failedIndex >= 0) {
              setCurrentStepIndex(failedIndex);
            }
          }
          scrollToFirstError();
          onValidationError?.(methods.formState.errors);
          return;
        }

        const submissionData = {
          ...data,
          _meta: {
            schemaId: schema.$id,
            schemaVersion: schema.version,
            submittedAt: new Date().toISOString(),
            completedSteps: visibleSteps,
          },
        };

        await onSubmit(submissionData);
        setCompletedSteps((prev) => Array.from(new Set([...prev, ...visibleSteps])));
      } finally {
        setSubmitting(false);
      }
    },
    [
      methods.formState.errors,
      onSubmit,
      onValidationError,
      schema.$id,
      schema.version,
      validateAllSteps,
      visibleSteps,
    ],
  );

  const handleNext = React.useCallback(async () => {
    if (!currentStepSchema || !currentStepConfig || !currentStepId) {
      return;
    }
    const isValid = await validateCurrentStep();
    if (!isValid) {
      scrollToFirstError();
      return;
    }

    clearStepError(currentStepId);
    setCompletedSteps((prev) => (prev.includes(currentStepId) ? prev : [...prev, currentStepId]));

    let nextStepId: string | undefined =
      transitionEngineRef.current.getNextStep(schema, currentStepConfig.id, methods.getValues()) ??
      undefined;
    if (nextStepId && !visibleSteps.includes(nextStepId)) {
      nextStepId = undefined;
    }
    if (!nextStepId) {
      nextStepId = visibleSteps[currentStepIndex + 1];
    }

    if (nextStepId) {
      const nextIndex = visibleSteps.indexOf(nextStepId);
      if (nextIndex >= 0) {
        setStepHistory((history) => [...history, currentStepId]);
        setCurrentStepIndex(nextIndex);
        return;
      }
    }

    if (currentStepIndex === visibleSteps.length - 1) {
      await handleFormSubmit(methods.getValues());
    }
  }, [
    clearStepError,
    currentStepConfig,
    currentStepId,
    currentStepIndex,
    currentStepSchema,
    handleFormSubmit,
    methods,
    schema,
    validateCurrentStep,
    visibleSteps,
  ]);

  const handlePrevious = React.useCallback(() => {
    if (!currentStepId) {
      return;
    }
    const previousFromHistory = stepHistory[stepHistory.length - 1];
    const fallbackIndex = visibleSteps.indexOf(currentStepId) - 1;
    const fallbackStep = fallbackIndex >= 0 ? visibleSteps[fallbackIndex] : undefined;
    const targetStep = previousFromHistory ?? fallbackStep;
    if (!targetStep) {
      return;
    }
    const previousIndex = visibleSteps.indexOf(targetStep);
    if (previousIndex >= 0) {
      setStepHistory((history) => history.slice(0, -1));
      setCurrentStepIndex(previousIndex);
    }
  }, [currentStepId, stepHistory, visibleSteps]);

  const focusField = React.useCallback((fieldName: string) => {
    if (typeof document === 'undefined') {
      return;
    }
    const escapedName =
      typeof CSS !== 'undefined' && typeof CSS.escape === 'function'
        ? CSS.escape(fieldName)
        : fieldName.replace(/"/g, '\\"');
    const selector = `[name="${escapedName}"]`;
    const element = document.querySelector<HTMLElement>(selector);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      if (typeof element.focus === 'function') {
        element.focus({ preventScroll: true });
      }
    }
  }, []);

  if (!currentStepSchema || !currentStepConfig || !visibleSteps.length) {
    return null;
  }

  const stepProperties = currentStepSchema.properties ?? {};
  const visibleFields = visibilityControllerRef.current.getVisibleFields(
    schema,
    currentStepId,
    watchedValues,
  );

  const stepStatusList = visibleSteps.map((stepId) =>
    getStepStatus(stepId, currentStepId, completedSteps, errorStepSet),
  );

  const widgetDefinitions = schema.ui?.widgets ?? {};

  return (
    <FormProvider {...methods}>
      <form className={className} onSubmit={methods.handleSubmit(handleFormSubmit)} noValidate>
        <div className="space-y-6">
          <StepProgress
            steps={visibleSteps.map((stepId, index) => ({
              id: stepId,
              title: schema.steps.find((step) => step.id === stepId)?.title ?? stepId,
              status: stepStatusList[index],
            }))}
            currentStep={currentStepId}
            onStepSelect={(stepId) => {
              const targetIndex = visibleSteps.indexOf(stepId);
              if (targetIndex >= 0 && targetIndex <= currentStepIndex) {
                setCurrentStepIndex(targetIndex);
              }
            }}
          />

          <div className="rounded-lg border bg-background shadow-sm">
            <div className="border-b p-6">
              <h2 className="text-lg font-semibold text-foreground">{currentStepConfig.title}</h2>
              {currentStepConfig.description ? (
                <p className="mt-2 text-sm text-muted-foreground">
                  {currentStepConfig.description}
                </p>
              ) : null}
            </div>

            <div className="space-y-6 p-6">
              <div className="space-y-4">
                {Object.entries(stepProperties).map(([fieldName, fieldSchema]) => {
                  if (!visibleFields.includes(fieldName)) {
                    return null;
                  }

                  const uiConfig = widgetDefinitions[fieldName];
                  if (!uiConfig) {
                    console.warn(`No widget configuration found for field: ${fieldName}`);
                    return null;
                  }

                  const {
                    component,
                    label,
                    placeholder,
                    helpText,
                    description,
                    className: widgetClassName,
                    options,
                    disabled,
                    readOnly,
                    ...componentProps
                  } = uiConfig;

                  const widget: WidgetType = component ?? 'Text';
                  const fieldError =
                    methods.formState.errors?.[fieldName as keyof typeof methods.formState.errors];
                  const errorMessage = (() => {
                    if (fieldError && typeof fieldError === 'object' && 'message' in fieldError) {
                      return (fieldError as { message?: string }).message ?? 'Invalid value';
                    }
                    if (typeof fieldError === 'string') {
                      return fieldError;
                    }
                    return undefined;
                  })();

                  const isRequired = Array.isArray(currentStepSchema.required)
                    ? currentStepSchema.required.includes(fieldName)
                    : false;

                  return (
                    <FieldFactory
                      key={fieldName}
                      name={fieldName}
                      label={label ?? fieldName}
                      widget={widget}
                      placeholder={placeholder}
                      description={description}
                      helpText={helpText}
                      className={widgetClassName as string | undefined}
                      disabled={mode === 'view' || disabled}
                      readOnly={readOnly}
                      required={isRequired}
                      control={methods.control}
                      rules={undefined}
                      options={options}
                      componentProps={componentProps as Record<string, unknown>}
                      error={errorMessage}
                    />
                  );
                })}
              </div>

              <ErrorSummary errors={methods.formState.errors} onFocusField={focusField} />
            </div>

            <div
              className={cn('flex items-center justify-between gap-4 border-t p-6', 'bg-muted/30')}
            >
              <button
                type="button"
                onClick={handlePrevious}
                disabled={currentStepIndex === 0}
                className={cn(
                  'rounded-md border border-input px-4 py-2 text-sm font-medium text-foreground transition-colors',
                  currentStepIndex === 0 && 'opacity-50',
                )}
              >
                Previous
              </button>

              <div className="flex gap-2">
                {currentStepIndex < visibleSteps.length - 1 ? (
                  <button
                    type="button"
                    onClick={handleNext}
                    className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow hover:bg-primary/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    disabled={isSubmitting}
                  >
                    Next
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow hover:bg-primary/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  >
                    {isSubmitting ? 'Submitting…' : 'Submit'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </form>
    </FormProvider>
  );
};
