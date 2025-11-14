import * as React from 'react';
import { type FieldValues } from 'react-hook-form';
import type { FieldProps } from '../types';
export type CurrencyFieldProps<TFieldValues extends FieldValues = FieldValues> = FieldProps<TFieldValues, number | null> & {
    currency?: string;
    locale?: string;
    prefix?: string;
    min?: number;
    max?: number;
    step?: number;
};
export declare const CurrencyField: React.FC<CurrencyFieldProps>;
//# sourceMappingURL=CurrencyField.d.ts.map