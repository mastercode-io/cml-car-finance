'use client';

import { useEffect, useMemo, useRef } from 'react';
import type { UseFormProps, UseFormReturn } from 'react-hook-form';

import type { UnifiedFormSchema } from '../types';

export type ValidationStrategy = 'onChange' | 'onBlur' | 'onSubmit';

export interface ResolvedValidationConfig {
  strategy: ValidationStrategy;
  debounceMs: number;
}

const DEFAULT_STRATEGY: ValidationStrategy = 'onBlur';

export function resolveValidationConfig(schema: UnifiedFormSchema): ResolvedValidationConfig {
  const strategy = schema.validation?.strategy ?? DEFAULT_STRATEGY;
  const debounce = schema.validation?.debounceMs ?? 0;
  return {
    strategy,
    debounceMs: strategy === 'onChange' ? Math.max(0, debounce) : 0,
  };
}

export interface ValidationModes {
  mode: UseFormProps['mode'];
  reValidateMode: UseFormProps['reValidateMode'];
  validateOnStepChange: boolean;
  manualOnChange: boolean;
}

export function getValidationModes(
  strategy: ValidationStrategy,
  debounceMs: number,
): ValidationModes {
  if (strategy === 'onSubmit') {
    return {
      mode: 'onSubmit',
      reValidateMode: 'onSubmit',
      validateOnStepChange: false,
      manualOnChange: false,
    };
  }

  const shouldDebounce = strategy === 'onChange' && debounceMs > 0;

  if (strategy === 'onBlur') {
    return {
      mode: 'onBlur',
      reValidateMode: 'onChange',
      validateOnStepChange: true,
      manualOnChange: false,
    };
  }

  if (shouldDebounce) {
    return {
      mode: 'onSubmit',
      reValidateMode: 'onSubmit',
      validateOnStepChange: true,
      manualOnChange: true,
    };
  }

  return {
    mode: 'onChange',
    reValidateMode: 'onChange',
    validateOnStepChange: true,
    manualOnChange: false,
  };
}

export function useValidationStrategyEffects(
  methods: UseFormReturn<Record<string, unknown>>,
  strategy: ValidationStrategy,
  debounceMs: number,
): void {
  const timersRef = useRef(new Map<string, ReturnType<typeof setTimeout>>());

  useEffect(() => {
    if (strategy !== 'onChange' || debounceMs <= 0) {
      return () => undefined;
    }

    const subscription = methods.watch((_, info) => {
      const fieldName = info?.name;
      const eventType = info?.type;
      if (!fieldName || eventType !== 'change') {
        return;
      }

      const existing = timersRef.current.get(fieldName);
      if (existing) {
        clearTimeout(existing);
      }

      const timerId = setTimeout(() => {
        void methods.trigger(fieldName as any, { shouldFocus: false });
        timersRef.current.delete(fieldName);
      }, debounceMs);

      timersRef.current.set(fieldName, timerId);
    });

    return () => {
      subscription.unsubscribe();
      timersRef.current.forEach((timerId) => {
        clearTimeout(timerId);
      });
      timersRef.current.clear();
    };
  }, [debounceMs, methods, strategy]);
}

export function useResolvedValidation(schema: UnifiedFormSchema): {
  config: ResolvedValidationConfig;
  modes: ValidationModes;
} {
  const config = useMemo(() => resolveValidationConfig(schema), [schema]);
  const modes = useMemo(() => getValidationModes(config.strategy, config.debounceMs), [config]);
  return { config, modes };
}
