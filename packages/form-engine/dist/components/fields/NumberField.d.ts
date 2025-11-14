import * as React from 'react';
import { type FieldValues } from 'react-hook-form';
import type { FieldProps } from './types';
export type NumberFieldProps<TFieldValues extends FieldValues = FieldValues> = FieldProps<TFieldValues, number | null> & {
    min?: number;
    max?: number;
    step?: number;
};
export declare const NumberField: React.FC<NumberFieldProps>;
//# sourceMappingURL=NumberField.d.ts.map