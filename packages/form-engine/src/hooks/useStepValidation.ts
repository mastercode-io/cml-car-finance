import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import type { JSONSchema, StepValidationResult, ValidationError } from '../types';
import { StepValidator } from '../validation/step-validator';
import { ValidationWorkerClient } from '../validation/worker-client';

interface ValidationState {
  isValidating: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
  isValid: boolean;
}

export interface StepValidationHook extends ValidationState {
  validate(data: unknown): Promise<boolean>;
  clearErrors(): void;
  lastResult?: StepValidationResult;
}

export function useStepValidation(stepId: string, schema: JSONSchema): StepValidationHook {
  const [validationState, setValidationState] = useState<ValidationState>({
    isValidating: false,
    errors: [],
    warnings: [],
    isValid: true,
  });
  const lastResultRef = useRef<StepValidationResult | null>(null);
  const validatorRef = useRef<StepValidator | null>(null);
  const workerRef = useRef<ValidationWorkerClient | null>(null);

  const useWorker = useMemo(() => shouldUseWorker(schema), [schema]);

  useEffect(() => {
    const validator = new StepValidator();
    validator.registerStep(stepId, schema);
    validatorRef.current = validator;

    if (useWorker) {
      const worker = new ValidationWorkerClient();
      validator.attachWorker(worker);
      workerRef.current = worker;
    } else {
      validator.attachWorker(null);
      workerRef.current = null;
    }

    return () => {
      workerRef.current?.terminate();
      workerRef.current = null;
      validatorRef.current = null;
    };
  }, [schema, stepId, useWorker]);

  const validate = useCallback(
    async (data: unknown): Promise<boolean> => {
      const validator = validatorRef.current;
      if (!validator) {
        return true;
      }

      setValidationState((prev) => ({ ...prev, isValidating: true }));

      try {
        const result = await validator.validateStep(stepId, data, {
          fullData: true,
          blockOnError: false,
          useWorker,
          timeout: 50,
        });

        lastResultRef.current = result;
        setValidationState({
          isValidating: false,
          errors: result.errors,
          warnings: result.warnings,
          isValid: result.valid,
        });

        return result.valid;
      } catch (error) {
        setValidationState({
          isValidating: false,
          errors: [
            {
              path: '',
              message: 'Validation failed',
            },
          ],
          warnings: [],
          isValid: false,
        });
        return false;
      }
    },
    [stepId, useWorker],
  );

  const clearErrors = useCallback(() => {
    setValidationState({
      isValidating: false,
      errors: [],
      warnings: [],
      isValid: true,
    });
    lastResultRef.current = null;
  }, []);

  return {
    ...validationState,
    validate,
    clearErrors,
    lastResult: lastResultRef.current ?? undefined,
  };
}

function shouldUseWorker(schema: JSONSchema): boolean {
  if (!schema?.properties) {
    return false;
  }

  const propertyCount = Object.keys(schema.properties).length;
  const schemaString = JSON.stringify(schema);
  const hasAsyncValidation = schemaString.includes('asyncValidate');
  const hasComplexRules = schemaString.includes('allOf') || schemaString.includes('anyOf');

  return propertyCount > 20 || hasAsyncValidation || hasComplexRules;
}
