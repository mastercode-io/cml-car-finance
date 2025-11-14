'use client';
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import * as React from 'react';
import { Controller } from 'react-hook-form';
import { cn } from '../../utils/cn';
const parseRatingValue = (value) => {
    if (value === null || value === undefined || value === '') {
        return null;
    }
    const parsed = typeof value === 'number' ? value : Number(value);
    return Number.isNaN(parsed) ? null : parsed;
};
const DefaultIcon = ({ filled }) => (_jsx("span", { "aria-hidden": "true", className: filled ? 'text-primary' : 'text-muted-foreground', children: "\u2605" }));
export const RatingField = (props) => {
    const { id, name, control, rules, disabled, readOnly, onChange, onValueChange, onNumberChange, onBlur, onFocus, className, defaultValue, value, ariaDescribedBy, ariaInvalid, ariaRequired, componentProps, maxRating = 5, icon, } = props;
    const fieldId = id ?? name;
    const resolvedComponentProps = (componentProps ??
        {});
    const hasExternalValue = value !== undefined;
    const [internalValue, setInternalValue] = React.useState(() => hasExternalValue ? parseRatingValue(value) : parseRatingValue(defaultValue));
    const IconComponent = icon
        ? ({ filled }) => (_jsx("span", { className: filled ? 'text-primary' : 'text-muted-foreground', children: icon }))
        : DefaultIcon;
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
        }
    }, [onChange, onNumberChange, onValueChange]);
    React.useEffect(() => {
        if (hasExternalValue) {
            setInternalValue(parseRatingValue(value));
        }
    }, [hasExternalValue, value]);
    const renderRating = (currentValue, onValueUpdate, invalid) => (_jsx("div", { className: cn('inline-flex items-center gap-2', className), role: "radiogroup", "aria-required": ariaRequired, "aria-invalid": invalid, "aria-describedby": ariaDescribedBy, children: Array.from({ length: Math.max(maxRating, 1) }, (_, index) => {
            const ratingValue = index + 1;
            const optionId = `${fieldId}-${ratingValue}`;
            const isFilled = currentValue !== null && currentValue >= ratingValue;
            return (_jsxs("label", { htmlFor: optionId, className: "cursor-pointer", children: [_jsx("span", { className: "sr-only", children: ratingValue }), _jsx("input", { ...resolvedComponentProps, id: optionId, type: "radio", name: name, value: ratingValue, className: "sr-only", checked: currentValue === ratingValue, disabled: disabled || resolvedComponentProps.disabled, readOnly: readOnly, onChange: (event) => {
                            if (event.target.checked) {
                                onValueUpdate(ratingValue);
                            }
                        }, onBlur: handleBlur, onFocus: handleFocus }), _jsx(IconComponent, { filled: isFilled })] }, optionId));
        }) }));
    if (control) {
        return (_jsx(Controller, { name: name, control: control, rules: rules, defaultValue: parseRatingValue(defaultValue), render: ({ field, fieldState }) => renderRating(parseRatingValue(field.value), (nextValue) => {
                field.onChange(nextValue);
                emitValue(nextValue);
            }, ariaInvalid ?? Boolean(fieldState.error)) }));
    }
    return renderRating(hasExternalValue ? parseRatingValue(value) : internalValue, (nextValue) => {
        if (!hasExternalValue) {
            setInternalValue(nextValue);
        }
        emitValue(nextValue);
    }, ariaInvalid);
};
//# sourceMappingURL=RatingField.js.map