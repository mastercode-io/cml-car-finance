import * as React from 'react';
import { type FieldValues } from 'react-hook-form';
import type { FieldProps } from './types';
export type DateFieldProps<TFieldValues extends FieldValues = FieldValues> = FieldProps<TFieldValues, string | Date | null> & {
    min?: string | Date;
    max?: string | Date;
};
export declare const DateField: React.FC<DateFieldProps>;
//# sourceMappingURL=DateField.d.ts.map