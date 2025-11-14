'use client';
import { jsx as _jsx } from "react/jsx-runtime";
import * as React from 'react';
import { Controller } from 'react-hook-form';
import { Input } from '../ui/input';
import { cn } from '../../utils/cn';
const parseNumberValue = (value) => {
    if (value === '') {
        return null;
    }
    const next = Number(value);
    return Number.isNaN(next) ? null : next;
};
export const NumberField = (props) => {
    const { id, name, control, rules, disabled, readOnly, placeholder, onChange, onValueChange, onNumberChange, onBlur, onFocus, className, defaultValue, value, ariaDescribedBy, ariaInvalid, ariaRequired, componentProps, min, max, step, } = props;
    const fieldId = id ?? name;
    const resolvedComponentProps = (componentProps ?? {});
    const { className: componentClassName, onChange: componentOnChange, onBlur: componentOnBlur, onFocus: componentOnFocus, defaultValue: componentDefaultValue, placeholder: componentPlaceholder, disabled: componentDisabled, readOnly: componentReadOnly, min: componentMin, max: componentMax, step: componentStep, ...restComponentProps } = resolvedComponentProps;
    const mergedMin = min ?? componentMin;
    const mergedMax = max ?? componentMax;
    const mergedStep = step ?? componentStep;
    const handleBlur = React.useCallback((event) => {
        onBlur?.(event);
    }, [onBlur]);
    const handleFocus = React.useCallback((event) => {
        onFocus?.(event);
    }, [onFocus]);
    const handleValueChange = React.useCallback((event) => {
        const nextValue = parseNumberValue(event.target.value);
        onChange?.(nextValue);
        onValueChange?.(nextValue);
        if (typeof nextValue === 'number') {
            onNumberChange?.(nextValue);
        }
    }, [onChange, onNumberChange, onValueChange]);
    if (control) {
        return (_jsx(Controller, { name: name, control: control, rules: rules, defaultValue: typeof defaultValue === 'number'
                ? defaultValue
                : parseNumberValue(String(defaultValue ?? '')), render: ({ field, fieldState }) => (_jsx(Input, { ...restComponentProps, id: fieldId, type: "number", inputMode: "decimal", name: name, value: typeof field.value === 'number'
                    ? field.value
                    : (parseNumberValue(String(field.value ?? '')) ?? ''), placeholder: placeholder ?? componentPlaceholder, disabled: disabled ?? componentDisabled, readOnly: readOnly ?? componentReadOnly, min: mergedMin, max: mergedMax, step: mergedStep, "aria-describedby": ariaDescribedBy, "aria-invalid": ariaInvalid ?? Boolean(fieldState.error), "aria-required": ariaRequired, className: cn(componentClassName, className, (ariaInvalid ?? Boolean(fieldState.error)) && 'border-destructive'), onChange: (event) => {
                    componentOnChange?.(event);
                    const nextValue = parseNumberValue(event.target.value);
                    field.onChange(nextValue);
                    handleValueChange(event);
                }, onBlur: (event) => {
                    componentOnBlur?.(event);
                    field.onBlur();
                    handleBlur(event);
                }, onFocus: (event) => {
                    componentOnFocus?.(event);
                    handleFocus(event);
                }, ref: field.ref })) }));
    }
    const inputValue = value === undefined
        ? undefined
        : typeof value === 'number'
            ? value
            : value === null
                ? ''
                : undefined;
    const defaultInputValue = inputValue === undefined
        ? typeof defaultValue === 'number'
            ? defaultValue
            : (parseNumberValue(String(defaultValue ?? '')) ?? undefined)
        : undefined;
    return (_jsx(Input, { ...restComponentProps, id: fieldId, name: name, type: "number", inputMode: "decimal", value: inputValue ?? undefined, defaultValue: defaultInputValue ?? componentDefaultValue, placeholder: placeholder ?? componentPlaceholder, disabled: disabled ?? componentDisabled, readOnly: readOnly ?? componentReadOnly, min: mergedMin, max: mergedMax, step: mergedStep, "aria-describedby": ariaDescribedBy, "aria-invalid": ariaInvalid, "aria-required": ariaRequired, className: cn(componentClassName, className, ariaInvalid && 'border-destructive'), onChange: (event) => {
            componentOnChange?.(event);
            handleValueChange(event);
        }, onBlur: (event) => {
            componentOnBlur?.(event);
            handleBlur(event);
        }, onFocus: (event) => {
            componentOnFocus?.(event);
            handleFocus(event);
        } }));
};
//# sourceMappingURL=NumberField.js.map