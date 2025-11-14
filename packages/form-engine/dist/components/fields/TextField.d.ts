import * as React from 'react';
import { type FieldValues } from 'react-hook-form';
import type { FieldProps } from './types';
export type TextFieldProps<TFieldValues extends FieldValues = FieldValues> = FieldProps<TFieldValues, string | null>;
export declare const TextField: React.FC<TextFieldProps>;
//# sourceMappingURL=TextField.d.ts.map