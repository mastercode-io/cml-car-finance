'use client';
import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import * as React from 'react';
import { Controller } from 'react-hook-form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, } from '../ui/select';
import { cn } from '../../utils/cn';
const getOptionValue = (value, options) => {
    const matched = options.find((option) => String(option.value) === value);
    return matched ? matched.value : value;
};
export const SelectField = (props) => {
    const { id, name, control, rules, disabled, onChange, onValueChange, onBlur, onFocus, className, defaultValue, value, ariaDescribedBy, ariaInvalid, ariaRequired, componentProps, options = [], placeholder, readOnly, } = props;
    const fieldId = id ?? name;
    const resolvedComponentProps = (componentProps ?? {});
    const { triggerProps, contentProps, onValueChange: componentOnValueChange, disabled: componentDisabled, value: componentValue, defaultValue: componentDefaultValue, className: selectClassName, onBlur: legacyOnBlur, onFocus: legacyOnFocus, onChange: legacyOnChange, ...restSelectProps } = resolvedComponentProps;
    const { className: triggerClassName, onBlur: triggerOnBlur, onFocus: triggerOnFocus, disabled: triggerDisabled, ...restTriggerProps } = triggerProps ?? {};
    const mergedTriggerOnBlur = triggerOnBlur ?? legacyOnBlur;
    const mergedTriggerOnFocus = triggerOnFocus ?? legacyOnFocus;
    const { className: contentClassName, ...restContentProps } = contentProps ?? {};
    const hasExternalValue = value !== undefined;
    const [internalValue, setInternalValue] = React.useState(() => {
        if (hasExternalValue) {
            return value ?? null;
        }
        if (defaultValue !== null && defaultValue !== undefined) {
            return defaultValue;
        }
        if (componentValue !== undefined && componentValue !== null) {
            return getOptionValue(String(componentValue), options);
        }
        if (componentDefaultValue !== undefined && componentDefaultValue !== null) {
            return getOptionValue(String(componentDefaultValue), options);
        }
        return null;
    });
    React.useEffect(() => {
        if (hasExternalValue) {
            setInternalValue(value ?? null);
        }
    }, [hasExternalValue, value]);
    const handleBlur = React.useCallback((event) => {
        onBlur?.(event);
    }, [onBlur]);
    const handleFocus = React.useCallback((event) => {
        onFocus?.(event);
    }, [onFocus]);
    const emitValueChange = React.useCallback((nextValue) => {
        onChange?.(nextValue);
        onValueChange?.(nextValue);
    }, [onChange, onValueChange]);
    const renderOptions = () => options.map((option) => (_jsx(SelectItem, { value: String(option.value), children: option.label }, option.value)));
    const isReadOnly = Boolean(readOnly);
    const isDisabled = Boolean(disabled ?? componentDisabled ?? triggerDisabled);
    const renderSelect = (selectedValue, onSelected, invalid, describedBy, onBlurCallback) => {
        const primitiveValue = selectedValue === null || selectedValue === undefined ? undefined : String(selectedValue);
        return (_jsxs(_Fragment, { children: [_jsxs(Select, { ...restSelectProps, value: primitiveValue, onValueChange: (next) => {
                        componentOnValueChange?.(next);
                        legacyOnChange?.({ target: { value: next } });
                        if (isReadOnly) {
                            return;
                        }
                        const parsedValue = getOptionValue(next, options);
                        onSelected(parsedValue);
                        emitValueChange(parsedValue);
                    }, disabled: isDisabled || isReadOnly, children: [_jsx(SelectTrigger, { ...restTriggerProps, id: fieldId, "aria-describedby": describedBy, "aria-invalid": invalid, "aria-required": ariaRequired, className: cn(selectClassName, triggerClassName, className, invalid && 'border-destructive'), disabled: isDisabled || isReadOnly, onBlur: (event) => {
                                mergedTriggerOnBlur?.(event);
                                onBlurCallback?.();
                                handleBlur(event);
                            }, onFocus: (event) => {
                                mergedTriggerOnFocus?.(event);
                                handleFocus(event);
                            }, children: _jsx(SelectValue, { placeholder: placeholder }) }), _jsx(SelectContent, { ...restContentProps, className: cn(contentClassName), children: renderOptions() })] }), _jsx("input", { type: "hidden", name: name, value: primitiveValue ?? '' })] }));
    };
    if (control) {
        return (_jsx(Controller, { name: name, control: control, rules: rules, defaultValue: defaultValue === null || defaultValue === undefined
                ? undefined
                : defaultValue, render: ({ field, fieldState }) => renderSelect(field.value, (nextValue) => {
                field.onChange(nextValue);
                if (!hasExternalValue) {
                    setInternalValue(nextValue);
                }
            }, ariaInvalid ?? Boolean(fieldState.error), ariaDescribedBy, () => field.onBlur()) }));
    }
    const currentValue = hasExternalValue
        ? (value ?? null)
        : internalValue;
    return renderSelect(currentValue, (nextValue) => {
        if (!hasExternalValue) {
            setInternalValue(nextValue);
        }
    }, ariaInvalid, ariaDescribedBy);
};
//# sourceMappingURL=SelectField.js.map