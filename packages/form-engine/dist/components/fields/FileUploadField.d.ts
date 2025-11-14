import * as React from 'react';
import { type FieldValues } from 'react-hook-form';
import type { FieldProps } from './types';
export type FileUploadFieldProps<TFieldValues extends FieldValues = FieldValues> = FieldProps<TFieldValues, FileList | null> & {
    accept?: string;
    multiple?: boolean;
};
export declare const FileUploadField: React.FC<FileUploadFieldProps>;
//# sourceMappingURL=FileUploadField.d.ts.map