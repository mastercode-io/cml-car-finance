import * as React from 'react';
import { type FieldValues } from 'react-hook-form';
import type { FieldProps } from '../types';
export type PhoneFieldProps<TFieldValues extends FieldValues = FieldValues> = FieldProps<TFieldValues, string | null> & {
    pattern?: string;
};
export declare const PhoneField: React.FC<PhoneFieldProps>;
//# sourceMappingURL=PhoneField.d.ts.map