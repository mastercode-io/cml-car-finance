import * as React from 'react';
import type { CheckedState } from '@radix-ui/react-checkbox';
export type InputChange = React.ChangeEvent<HTMLInputElement>;
export type TextareaChange = React.ChangeEvent<HTMLTextAreaElement>;
export type SelectChange = React.ChangeEvent<HTMLSelectElement>;
export type FocusEvt = React.FocusEvent<HTMLElement>;
export type FileChange = React.ChangeEvent<HTMLInputElement>;
export type OnCheckedChange = (value: CheckedState) => void;
export type OnStringChange = (value: string) => void;
export type OnNumberChange = (value: number) => void;
export type OnSliderChange = (value: number[]) => void;
export type OnDateSelect = (date: Date | undefined) => void;
export type OnFileSelect = (files: FileList | null) => void;
export type DatePredicate = (date: Date) => boolean;
export type FieldValue = string | number | boolean | Date | File | FileList | null | undefined;
export type FieldValidator = (value: FieldValue) => boolean | string;
export type FieldFormatter = (value: FieldValue) => string;
export type FieldParser = (value: string) => FieldValue;
//# sourceMappingURL=events.d.ts.map