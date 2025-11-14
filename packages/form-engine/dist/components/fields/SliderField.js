'use client';
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import * as React from 'react';
import { Controller } from 'react-hook-form';
import { cn } from '../../utils/cn';
const parseSliderValue = (value) => {
    if (value === '') {
        return null;
    }
    const parsed = Number(value);
    return Number.isNaN(parsed) ? null : parsed;
};
const coerceSliderInput = (input) => {
    if (typeof input === 'number') {
        return Number.isNaN(input) ? null : input;
    }
    if (input === null || input === undefined) {
        return null;
    }
    return parseSliderValue(String(input));
};
export const SliderField = (props) => {
    const { id, name, control, rules, disabled, readOnly, onChange, onValueChange, onNumberChange, onSliderChange, onBlur, onFocus, className, defaultValue, value, ariaDescribedBy, ariaInvalid, componentProps, min = 0, max = 100, step = 1, showValue = true, } = props;
    const fieldId = id ?? name;
    const resolvedComponentProps = (componentProps ??
        {});
    const hasExternalValue = value !== undefined;
    const [internalValue, setInternalValue] = React.useState(() => hasExternalValue ? coerceSliderInput(value) : coerceSliderInput(defaultValue));
    const handleBlur = React.useCallback((event) => {
        onBlur?.(event);
    }, [onBlur]);
    const handleFocus = React.useCallback((event) => {
        onFocus?.(event);
    }, [onFocus]);
    const emitValue = React.useCallback((nextValue) => {
        onChange?.(nextValue);
        onValueChange?.(nextValue);
        if (typeof nextValue === 'number') {
            onNumberChange?.(nextValue);
            onSliderChange?.([nextValue]);
        }
    }, [onChange, onNumberChange, onSliderChange, onValueChange]);
    React.useEffect(() => {
        if (hasExternalValue) {
            setInternalValue(coerceSliderInput(value));
        }
    }, [hasExternalValue, value]);
    const renderSlider = (currentValue, onValueUpdate, invalid) => (_jsxs("div", { className: cn('flex w-full items-center gap-3', className), children: [_jsx("input", { ...resolvedComponentProps, id: fieldId, name: name, type: "range", min: min, max: max, step: step, value: currentValue ?? '', disabled: disabled || resolvedComponentProps.disabled, readOnly: readOnly, "aria-describedby": ariaDescribedBy, "aria-invalid": invalid, onChange: (event) => {
                    const next = parseSliderValue(event.target.value);
                    onValueUpdate(next);
                }, onBlur: handleBlur, onFocus: handleFocus }), showValue ? (_jsx("output", { htmlFor: fieldId, "aria-live": "polite", className: "text-sm text-muted-foreground", children: currentValue ?? '—' })) : null] }));
    if (control) {
        return (_jsx(Controller, { name: name, control: control, rules: rules, defaultValue: coerceSliderInput(defaultValue), render: ({ field, fieldState }) => renderSlider(coerceSliderInput(field.value), (nextValue) => {
                field.onChange(nextValue);
                emitValue(nextValue);
            }, ariaInvalid ?? Boolean(fieldState.error)) }));
    }
    return renderSlider(hasExternalValue ? coerceSliderInput(value) : internalValue, (nextValue) => {
        if (!hasExternalValue) {
            setInternalValue(nextValue);
        }
        emitValue(nextValue);
    }, ariaInvalid);
};
//# sourceMappingURL=SliderField.js.map