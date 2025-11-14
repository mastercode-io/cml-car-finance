import * as React from 'react';
import { type FieldValues } from 'react-hook-form';
import type { FieldProps } from './types';
export type SliderFieldProps<TFieldValues extends FieldValues = FieldValues> = FieldProps<TFieldValues, number | null> & {
    min?: number;
    max?: number;
    step?: number;
    showValue?: boolean;
};
export declare const SliderField: React.FC<SliderFieldProps>;
//# sourceMappingURL=SliderField.d.ts.map