import type { FieldErrors } from 'react-hook-form';

import type { FormStep, JSONSchema, UnifiedFormSchema } from '../types';

export type StepStatus = 'completed' | 'current' | 'upcoming' | 'error';

export function resolveStepSchema(step: FormStep, schema: UnifiedFormSchema): JSONSchema {
  if ('$ref' in step.schema && typeof step.schema.$ref === 'string') {
    const refPath = step.schema.$ref.replace('#/', '').split('/');
    let resolved: any = schema;
    for (const segment of refPath) {
      resolved = resolved?.[segment];
      if (resolved === undefined) {
        throw new Error(`Unable to resolve schema reference: ${step.schema.$ref}`);
      }
    }
    return resolved as JSONSchema;
  }

  return step.schema as JSONSchema;
}

export function getStepFieldNames(step: FormStep, schema: UnifiedFormSchema): string[] {
  const stepSchema = resolveStepSchema(step, schema);
  return stepSchema.properties ? Object.keys(stepSchema.properties) : [];
}

export function getStepStatus(
  stepId: string,
  currentStep: string | undefined,
  completedSteps: string[],
  errorSteps: Set<string>,
): StepStatus {
  if (stepId === currentStep) {
    return errorSteps.has(stepId) ? 'error' : 'current';
  }
  if (errorSteps.has(stepId)) {
    return 'error';
  }
  if (completedSteps.includes(stepId)) {
    return 'completed';
  }
  return 'upcoming';
}

export interface FlattenedFieldError {
  name: string;
  message?: string;
}

export function flattenFieldErrors(errors: FieldErrors, parentPath = ''): FlattenedFieldError[] {
  const result: FlattenedFieldError[] = [];

  Object.entries(errors ?? {}).forEach(([key, value]) => {
    if (!value) {
      return;
    }

    const path = parentPath ? `${parentPath}.${key}` : key;

    if (isFieldError(value)) {
      result.push({ name: path, message: value.message });
      if (value.types) {
        Object.entries(value.types).forEach(([typeKey, typeValue]) => {
          result.push({ name: `${path}.${typeKey}`, message: String(typeValue) });
        });
      }
      return;
    }

    if (Array.isArray(value)) {
      value.forEach((item, index) => {
        if (item) {
          result.push(...flattenFieldErrors(item as FieldErrors, `${path}[${index}]`));
        }
      });
      return;
    }

    if (typeof value === 'object') {
      result.push(...flattenFieldErrors(value as FieldErrors, path));
    }
  });

  return result;
}

export function scrollToFirstError(): void {
  if (typeof document === 'undefined') {
    return;
  }

  const firstError = document.querySelector<HTMLElement>('[aria-invalid="true"]');
  if (firstError) {
    firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
    if (typeof firstError.focus === 'function') {
      firstError.focus({ preventScroll: true });
    }
  }
}

function isFieldError(
  value: unknown,
): value is { message?: string; types?: Record<string, unknown> } {
  return (
    Boolean(value) && typeof value === 'object' && 'type' in (value as Record<string, unknown>)
  );
}
