import type { UseFormProps, UseFormReturn } from 'react-hook-form';
import type { UnifiedFormSchema } from '../types';
export type ValidationStrategy = 'onChange' | 'onBlur' | 'onSubmit';
export interface ResolvedValidationConfig {
    strategy: ValidationStrategy;
    debounceMs: number;
}
export declare function resolveValidationConfig(schema: UnifiedFormSchema): ResolvedValidationConfig;
export interface ValidationModes {
    mode: UseFormProps['mode'];
    reValidateMode: UseFormProps['reValidateMode'];
    validateOnStepChange: boolean;
    manualOnChange: boolean;
}
export declare function getValidationModes(strategy: ValidationStrategy, debounceMs: number): ValidationModes;
export declare function useValidationStrategyEffects(methods: UseFormReturn<Record<string, unknown>>, strategy: ValidationStrategy, debounceMs: number): () => Promise<void>;
export declare function useResolvedValidation(schema: UnifiedFormSchema): {
    config: ResolvedValidationConfig;
    modes: ValidationModes;
};
//# sourceMappingURL=useValidation.d.ts.map