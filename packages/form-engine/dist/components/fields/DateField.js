'use client';
import { jsx as _jsx } from "react/jsx-runtime";
import * as React from 'react';
import { Controller } from 'react-hook-form';
import { Input } from '../ui/input';
import { cn } from '../../utils/cn';
const toInputValue = (value) => {
    if (value instanceof Date) {
        return value.toISOString().split('T')[0] ?? '';
    }
    return typeof value === 'string' ? value : '';
};
const normalizeDateBoundary = (value) => {
    if (!value) {
        return undefined;
    }
    if (value instanceof Date) {
        return value.toISOString().split('T')[0] ?? undefined;
    }
    return value;
};
const toDate = (value) => {
    if (!value) {
        return undefined;
    }
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? undefined : parsed;
};
export const DateField = (props) => {
    const { id, name, control, rules, disabled, readOnly, onChange, onValueChange, onDateSelect, onBlur, onFocus, className, placeholder, defaultValue, value, ariaDescribedBy, ariaInvalid, ariaRequired, componentProps, min, max, } = props;
    const fieldId = id ?? name;
    const resolvedComponentProps = (componentProps ?? {});
    const { className: componentClassName, onChange: componentOnChange, onBlur: componentOnBlur, onFocus: componentOnFocus, defaultValue: componentDefaultValue, disabled: componentDisabled, readOnly: componentReadOnly, min: componentMin, max: componentMax, placeholder: componentPlaceholder, ...restComponentProps } = resolvedComponentProps;
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
        onDateSelect?.(toDate(nextValue));
    }, [onChange, onDateSelect, onValueChange]);
    const minValue = normalizeDateBoundary(min ?? componentMin);
    const maxValue = normalizeDateBoundary(max ?? componentMax);
    if (control) {
        return (_jsx(Controller, { name: name, control: control, rules: rules, defaultValue: toInputValue(defaultValue), render: ({ field, fieldState }) => (_jsx(Input, { ...restComponentProps, id: fieldId, type: "date", name: name, disabled: disabled ?? componentDisabled, readOnly: readOnly ?? componentReadOnly, value: toInputValue(field.value), min: minValue, max: maxValue, "aria-describedby": ariaDescribedBy, "aria-invalid": ariaInvalid ?? Boolean(fieldState.error), "aria-required": ariaRequired, className: cn(componentClassName, className, (ariaInvalid ?? Boolean(fieldState.error)) && 'border-destructive'), onChange: (event) => {
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
                }, placeholder: placeholder ?? componentPlaceholder, ref: field.ref })) }));
    }
    const inputValue = value !== undefined ? toInputValue(value) : undefined;
    const defaultInputValue = inputValue === undefined ? toInputValue(defaultValue) : undefined;
    return (_jsx(Input, { ...restComponentProps, id: fieldId, name: name, type: "date", disabled: disabled ?? componentDisabled, readOnly: readOnly ?? componentReadOnly, value: inputValue ?? undefined, defaultValue: defaultInputValue ?? componentDefaultValue, placeholder: placeholder ?? componentPlaceholder, min: minValue, max: maxValue, "aria-describedby": ariaDescribedBy, "aria-invalid": ariaInvalid, "aria-required": ariaRequired, className: cn(componentClassName, className, ariaInvalid && 'border-destructive'), onChange: (event) => {
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
//# sourceMappingURL=DateField.js.map