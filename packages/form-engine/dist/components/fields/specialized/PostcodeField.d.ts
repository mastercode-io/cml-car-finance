import * as React from 'react';
import { type FieldValues } from 'react-hook-form';
import type { FieldProps } from '../types';
export type PostcodeFieldProps<TFieldValues extends FieldValues = FieldValues> = FieldProps<TFieldValues, string | null> & {
    autoFormat?: boolean;
};
export declare const PostcodeField: React.FC<PostcodeFieldProps>;
//# sourceMappingURL=PostcodeField.d.ts.map