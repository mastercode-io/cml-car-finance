'use client';
import { useCallback, useEffect, useMemo, useRef } from 'react';
const DEFAULT_STRATEGY = 'onBlur';
export function resolveValidationConfig(schema) {
    const strategy = schema.validation?.strategy ?? DEFAULT_STRATEGY;
    const debounce = schema.validation?.debounceMs ?? 0;
    return {
        strategy,
        debounceMs: strategy === 'onChange' ? Math.max(0, debounce) : 0,
    };
}
export function getValidationModes(strategy, debounceMs) {
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
export function useValidationStrategyEffects(methods, strategy, debounceMs) {
    const timersRef = useRef(new Map());
    const pendingValidationsRef = useRef(new Map());
    const runValidation = useCallback((fieldName) => {
        const existing = pendingValidationsRef.current.get(fieldName);
        if (existing) {
            return existing;
        }
        const promise = methods
            .trigger(fieldName, { shouldFocus: false })
            .finally(() => {
            pendingValidationsRef.current.delete(fieldName);
        });
        pendingValidationsRef.current.set(fieldName, promise);
        return promise;
    }, [methods]);
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
                timersRef.current.delete(fieldName);
                void runValidation(fieldName);
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
    }, [debounceMs, methods, runValidation, strategy]);
    return useCallback(async () => {
        if (strategy !== 'onChange' || debounceMs <= 0) {
            return;
        }
        timersRef.current.forEach((timerId, fieldName) => {
            clearTimeout(timerId);
            timersRef.current.delete(fieldName);
            void runValidation(fieldName);
        });
        const pending = Array.from(new Set(pendingValidationsRef.current.values()));
        if (pending.length > 0) {
            await Promise.allSettled(pending);
        }
    }, [debounceMs, runValidation, strategy]);
}
export function useResolvedValidation(schema) {
    const config = useMemo(() => resolveValidationConfig(schema), [schema]);
    const modes = useMemo(() => getValidationModes(config.strategy, config.debounceMs), [config]);
    return { config, modes };
}
//# sourceMappingURL=useValidation.js.map