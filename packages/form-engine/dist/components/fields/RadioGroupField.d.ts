import * as React from 'react';
import { type FieldValues } from 'react-hook-form';
import type { FieldProps } from './types';
interface RadioOption {
    label: string;
    value: string | number;
    description?: string;
}
export type RadioGroupFieldProps<TFieldValues extends FieldValues = FieldValues> = FieldProps<TFieldValues, string | number | null> & {
    options?: RadioOption[];
    orientation?: 'horizontal' | 'vertical';
};
export declare const RadioGroupField: React.FC<RadioGroupFieldProps>;
export {};
//# sourceMappingURL=RadioGroupField.d.ts.map