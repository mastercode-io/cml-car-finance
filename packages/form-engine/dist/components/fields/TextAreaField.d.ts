import * as React from 'react';
import { type FieldValues } from 'react-hook-form';
import type { FieldProps } from './types';
export type TextAreaFieldProps<TFieldValues extends FieldValues = FieldValues> = FieldProps<TFieldValues, string | null> & {
    rows?: number;
};
export declare const TextAreaField: React.FC<TextAreaFieldProps>;
//# sourceMappingURL=TextAreaField.d.ts.map