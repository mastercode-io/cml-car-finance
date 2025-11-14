'use client';
import { jsx as _jsx } from "react/jsx-runtime";
import * as React from 'react';
import { Controller } from 'react-hook-form';
import { Input } from '../ui/input';
import { cn } from '../../utils/cn';
export const TextField = (props) => {
    const { id, name, control, rules, disabled, readOnly, placeholder, onChange, onValueChange, onBlur, onFocus, className, defaultValue, value, ariaDescribedBy, ariaInvalid, ariaRequired, componentProps, } = props;
    const fieldId = id ?? name;
    const resolvedComponentProps = (componentProps ?? {});
    const { className: componentClassName, onChange: componentOnChange, onBlur: componentOnBlur, onFocus: componentOnFocus, defaultValue: componentDefaultValue, placeholder: componentPlaceholder, disabled: componentDisabled, readOnly: componentReadOnly, ...restComponentProps } = resolvedComponentProps;
    const handleBlur = React.useCallback((event) => {
        onBlur?.(event);
    }, [onBlur]);
    const handleFocus = React.useCallback((event) => {
        onFocus?.(event);
    }, [onFocus]);
    const handleChange = React.useCallback((event) => {
        const nextValue = event.target.value;
        onChange?.(nextValue);
        onValueChange?.(nextValue);
    }, [onChange, onValueChange]);
    if (control) {
        return (_jsx(Controller, { name: name, control: control, rules: rules, defaultValue: defaultValue ?? '', render: ({ field, fieldState }) => (_jsx(Input, { ...restComponentProps, id: fieldId, type: "text", name: name, value: field.value ?? '', placeholder: placeholder ?? componentPlaceholder, disabled: disabled ?? componentDisabled, readOnly: readOnly ?? componentReadOnly, "aria-describedby": ariaDescribedBy, "aria-invalid": ariaInvalid ?? Boolean(fieldState.error), "aria-required": ariaRequired, className: cn(componentClassName, className, (ariaInvalid ?? Boolean(fieldState.error)) && 'border-destructive'), onChange: (event) => {
                    componentOnChange?.(event);
                    field.onChange(event.target.value);
                    handleChange(event);
                }, onBlur: (event) => {
                    componentOnBlur?.(event);
                    field.onBlur();
                    handleBlur(event);
                }, onFocus: (event) => {
                    componentOnFocus?.(event);
                    handleFocus(event);
                }, ref: field.ref })) }));
    }
    const inputValue = value === null || value === undefined ? undefined : value;
    const defaultInputValue = inputValue === undefined
        ? defaultValue === null || defaultValue === undefined
            ? undefined
            : defaultValue
        : undefined;
    return (_jsx(Input, { ...restComponentProps, id: fieldId, name: name, type: "text", value: inputValue ?? undefined, defaultValue: defaultInputValue ?? componentDefaultValue, placeholder: placeholder ?? componentPlaceholder, disabled: disabled ?? componentDisabled, readOnly: readOnly ?? componentReadOnly, "aria-describedby": ariaDescribedBy, "aria-invalid": ariaInvalid, "aria-required": ariaRequired, className: cn(componentClassName, className, ariaInvalid && 'border-destructive'), onChange: (event) => {
            componentOnChange?.(event);
            handleChange(event);
        }, onBlur: (event) => {
            componentOnBlur?.(event);
            handleBlur(event);
        }, onFocus: (event) => {
            componentOnFocus?.(event);
            handleFocus(event);
        } }));
};
//# sourceMappingURL=TextField.js.map