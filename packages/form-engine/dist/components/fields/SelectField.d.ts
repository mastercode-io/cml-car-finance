import * as React from 'react';
import { type FieldValues } from 'react-hook-form';
import type { FieldProps } from './types';
interface SelectOption {
    label: string;
    value: string | number;
}
export type SelectFieldProps<TFieldValues extends FieldValues = FieldValues> = FieldProps<TFieldValues, string | number | null> & {
    options?: SelectOption[];
    placeholder?: string;
};
export declare const SelectField: React.FC<SelectFieldProps>;
export {};
//# sourceMappingURL=SelectField.d.ts.map