'use client';
import { jsx as _jsx } from "react/jsx-runtime";
import * as React from 'react';
import { Controller } from 'react-hook-form';
import { cn } from '../../../utils/cn';
export const PhoneField = (props) => {
    const { id, name, control, rules, disabled, readOnly, placeholder, onChange, onValueChange, onStringChange, onBlur, onFocus, className, defaultValue, value, ariaDescribedBy, ariaInvalid, ariaRequired, componentProps, pattern, } = props;
    const fieldId = id ?? name;
    const resolvedComponentProps = (componentProps ??
        {});
    const hasExternalValue = value !== undefined;
    const handleBlur = React.useCallback((event) => {
        onBlur?.(event);
    }, [onBlur]);
    const handleFocus = React.useCallback((event) => {
        onFocus?.(event);
    }, [onFocus]);
    const emitValue = React.useCallback((nextValue) => {
        onChange?.(nextValue);
        onValueChange?.(nextValue);
        onStringChange?.(nextValue);
    }, [onChange, onStringChange, onValueChange]);
    const initialValue = hasExternalValue
        ? (value ?? '')
        : (defaultValue ?? '');
    const [internalValue, setInternalValue] = React.useState(initialValue);
    React.useEffect(() => {
        if (hasExternalValue) {
            setInternalValue(value ?? '');
        }
    }, [hasExternalValue, value]);
    const renderInput = (currentValue, onValueUpdate, invalid) => (_jsx("input", { ...resolvedComponentProps, id: fieldId, name: name, type: "tel", inputMode: "tel", value: currentValue, placeholder: placeholder ?? resolvedComponentProps.placeholder, disabled: disabled || resolvedComponentProps.disabled, readOnly: readOnly, "aria-describedby": ariaDescribedBy, "aria-invalid": invalid, "aria-required": ariaRequired, pattern: pattern ?? resolvedComponentProps.pattern, className: cn('block w-full rounded-md border px-3 py-2 text-sm', className, invalid && 'border-destructive'), onChange: (event) => {
            const next = event.target.value;
            onValueUpdate(next);
        }, onBlur: handleBlur, onFocus: handleFocus }));
    if (control) {
        return (_jsx(Controller, { name: name, control: control, rules: rules, defaultValue: defaultValue ?? '', render: ({ field, fieldState }) => renderInput(field.value ?? '', (nextValue) => {
                field.onChange(nextValue);
                emitValue(nextValue);
            }, ariaInvalid ?? Boolean(fieldState.error)) }));
    }
    return renderInput(hasExternalValue ? (value ?? '') : internalValue, (nextValue) => {
        if (!hasExternalValue) {
            setInternalValue(nextValue);
        }
        emitValue(nextValue);
    }, ariaInvalid);
};
//# sourceMappingURL=PhoneField.js.map