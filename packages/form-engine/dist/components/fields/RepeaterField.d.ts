import { type FieldValues } from 'react-hook-form';
import type { FieldProps } from './types';
type RepeaterFieldProps<TFieldValues extends FieldValues = FieldValues> = FieldProps<TFieldValues, Record<string, unknown> | Record<string, unknown>[]>;
export declare const RepeaterField: {
    <TFieldValues extends FieldValues = FieldValues>(props: RepeaterFieldProps<TFieldValues>): import("react/jsx-runtime").JSX.Element;
    displayName: string;
};
export {};
//# sourceMappingURL=RepeaterField.d.ts.map