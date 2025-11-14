'use client';
import { jsx as _jsx } from "react/jsx-runtime";
import * as React from 'react';
import { Controller } from 'react-hook-form';
import { cn } from '../../utils/cn';
const toFileList = (event) => event.target.files ?? null;
export const FileUploadField = (props) => {
    const { id, name, control, rules, disabled, onChange, onValueChange, onFileSelect, onBlur, onFocus, className, ariaDescribedBy, ariaInvalid, ariaRequired, componentProps, accept, multiple, } = props;
    const fieldId = id ?? name;
    const resolvedComponentProps = (componentProps ??
        {});
    const handleBlur = React.useCallback((event) => {
        onBlur?.(event);
    }, [onBlur]);
    const handleFocus = React.useCallback((event) => {
        onFocus?.(event);
    }, [onFocus]);
    const emitValue = React.useCallback((nextValue) => {
        onChange?.(nextValue);
        onValueChange?.(nextValue);
        onFileSelect?.(nextValue);
    }, [onChange, onFileSelect, onValueChange]);
    const renderInput = (onFileChange, invalid) => (_jsx("input", { ...resolvedComponentProps, id: fieldId, name: name, type: "file", className: cn('block w-full text-sm', className, invalid && 'border-destructive'), accept: accept ?? resolvedComponentProps.accept, multiple: multiple ?? resolvedComponentProps.multiple, disabled: disabled || resolvedComponentProps.disabled, "aria-describedby": ariaDescribedBy, "aria-invalid": invalid, "aria-required": ariaRequired, onChange: (event) => {
            const files = toFileList(event);
            onFileChange(files);
        }, onBlur: handleBlur, onFocus: handleFocus }));
    if (control) {
        return (_jsx(Controller, { name: name, control: control, rules: rules, defaultValue: null, render: ({ field, fieldState }) => renderInput((nextValue) => {
                field.onChange(nextValue);
                emitValue(nextValue);
            }, ariaInvalid ?? Boolean(fieldState.error)) }));
    }
    return renderInput((nextValue) => {
        emitValue(nextValue);
    }, ariaInvalid);
};
//# sourceMappingURL=FileUploadField.js.map