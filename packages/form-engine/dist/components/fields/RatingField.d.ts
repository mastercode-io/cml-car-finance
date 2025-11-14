import * as React from 'react';
import { type FieldValues } from 'react-hook-form';
import type { FieldProps } from './types';
export type RatingFieldProps<TFieldValues extends FieldValues = FieldValues> = FieldProps<TFieldValues, number | null> & {
    maxRating?: number;
    icon?: React.ReactNode;
};
export declare const RatingField: React.FC<RatingFieldProps>;
//# sourceMappingURL=RatingField.d.ts.map