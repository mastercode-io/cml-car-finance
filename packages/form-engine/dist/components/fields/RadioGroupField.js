'use client';
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import * as React from 'react';
import { Controller } from 'react-hook-form';
import { cn } from '../../utils/cn';
const toPrimitive = (value) => value === null || value === undefined ? '' : String(value);
export const RadioGroupField = (props) => {
    const { id, name, control, rules, disabled, readOnly, onChange, onValueChange, onStringChange, onBlur, onFocus, className, defaultValue, value, ariaDescribedBy, ariaInvalid, ariaRequired, componentProps, options = [], orientation = 'vertical', } = props;
    const fieldId = id ?? name;
    const resolvedComponentProps = (componentProps ??
        {});
    const hasExternalValue = value !== undefined;
    const [internalValue, setInternalValue] = React.useState(() => {
        if (hasExternalValue) {
            return value ?? null;
        }
        return defaultValue ?? null;
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
    const handleValueChange = React.useCallback((nextValue) => {
        onChange?.(nextValue);
        onValueChange?.(nextValue);
        if (typeof nextValue === 'string') {
            onStringChange?.(nextValue);
        }
    }, [onChange, onStringChange, onValueChange]);
    const renderOptions = (selected, onSelect, isDisabled, invalid, describedBy) => (_jsx("div", { role: "radiogroup", "aria-describedby": describedBy, "aria-invalid": invalid, "aria-required": ariaRequired, className: cn('flex gap-4', orientation === 'vertical' ? 'flex-col' : 'flex-row', className), children: options.map((option) => {
            const optionId = `${fieldId}-${toPrimitive(option.value)}`;
            const checked = toPrimitive(selected) === toPrimitive(option.value);
            return (_jsxs("label", { htmlFor: optionId, className: "inline-flex cursor-pointer flex-col gap-1 text-sm", children: [_jsxs("span", { className: "inline-flex items-center gap-2", children: [_jsx("input", { ...resolvedComponentProps, id: optionId, type: "radio", name: name, value: option.value, checked: checked, disabled: isDisabled || resolvedComponentProps.disabled, readOnly: readOnly, onChange: (event) => {
                                    if (event.target.checked) {
                                        onSelect(option.value);
                                    }
                                }, onBlur: handleBlur, onFocus: handleFocus }), _jsx("span", { children: option.label })] }), option.description ? (_jsx("span", { className: "text-xs text-muted-foreground", children: option.description })) : null] }, optionId));
        }) }));
    if (control) {
        return (_jsx(Controller, { name: name, control: control, rules: rules, defaultValue: defaultValue === undefined || defaultValue === null
                ? undefined
                : defaultValue, render: ({ field, fieldState }) => renderOptions(field.value, (nextValue) => {
                field.onChange(nextValue);
                handleValueChange(nextValue);
            }, Boolean(disabled), ariaInvalid ?? Boolean(fieldState.error), ariaDescribedBy) }));
    }
    return renderOptions(hasExternalValue ? (value ?? null) : internalValue, (nextValue) => {
        if (!hasExternalValue) {
            setInternalValue(nextValue);
        }
        handleValueChange(nextValue);
    }, Boolean(disabled), ariaInvalid, ariaDescribedBy);
};
//# sourceMappingURL=RadioGroupField.js.map