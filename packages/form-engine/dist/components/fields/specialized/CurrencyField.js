'use client';
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import * as React from 'react';
import { Controller } from 'react-hook-form';
import { cn } from '../../../utils/cn';
const parseCurrencyValue = (value) => {
    if (value === null || value === undefined) {
        return null;
    }
    if (typeof value === 'number') {
        return Number.isNaN(value) ? null : value;
    }
    const normalized = value.replace(/[^0-9.,-]/g, '').replace(/,/g, '');
    if (normalized === '') {
        return null;
    }
    const parsed = Number(normalized);
    return Number.isNaN(parsed) ? null : parsed;
};
const getCurrencyPrefix = (currency, locale) => {
    if (!currency) {
        return undefined;
    }
    try {
        const parts = new Intl.NumberFormat(locale, {
            style: 'currency',
            currency,
            currencyDisplay: 'narrowSymbol',
        }).formatToParts(0);
        const symbol = parts.find((part) => part.type === 'currency');
        return symbol?.value ?? currency;
    }
    catch (error) {
        console.warn('Failed to resolve currency symbol', error);
        return currency;
    }
};
export const CurrencyField = (props) => {
    const { id, name, control, rules, disabled, readOnly, onChange, onValueChange, onNumberChange, onBlur, onFocus, className, defaultValue, value, ariaDescribedBy, ariaInvalid, ariaRequired, componentProps, currency, locale, prefix, min, max, step = 0.01, } = props;
    const fieldId = id ?? name;
    const resolvedComponentProps = (componentProps ??
        {});
    const { className: componentClassName, ...inputProps } = resolvedComponentProps;
    const resolvedPrefix = prefix ?? getCurrencyPrefix(currency, locale);
    const hasExternalValue = value !== undefined;
    const [internalValue, setInternalValue] = React.useState(() => hasExternalValue ? parseCurrencyValue(value) : parseCurrencyValue(defaultValue));
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
            setInternalValue(parseCurrencyValue(value));
        }
    }, [hasExternalValue, value]);
    const renderInput = (currentValue, onValueUpdate, invalid) => (_jsxs("div", { className: cn('flex items-center gap-2', className), children: [resolvedPrefix ? (_jsx("span", { className: "text-sm text-muted-foreground", "aria-hidden": "true", children: resolvedPrefix })) : null, _jsx("input", { ...inputProps, id: fieldId, name: name, type: "number", inputMode: "decimal", min: min ?? inputProps.min, max: max ?? inputProps.max, step: step ?? inputProps.step, value: currentValue ?? '', disabled: disabled || inputProps.disabled, readOnly: readOnly, "aria-describedby": ariaDescribedBy, "aria-invalid": invalid, "aria-required": ariaRequired, className: cn('block w-full rounded-md border px-3 py-2 text-sm', componentClassName, invalid && 'border-destructive'), onChange: (event) => {
                    const nextValue = parseCurrencyValue(event.target.value);
                    onValueUpdate(nextValue);
                }, onBlur: handleBlur, onFocus: handleFocus })] }));
    if (control) {
        return (_jsx(Controller, { name: name, control: control, rules: rules, defaultValue: parseCurrencyValue(defaultValue), render: ({ field, fieldState }) => renderInput(parseCurrencyValue(field.value), (nextValue) => {
                field.onChange(nextValue);
                emitValue(nextValue);
            }, ariaInvalid ?? Boolean(fieldState.error)) }));
    }
    return renderInput(hasExternalValue ? parseCurrencyValue(value) : internalValue, (nextValue) => {
        if (!hasExternalValue) {
            setInternalValue(nextValue);
        }
        emitValue(nextValue);
    }, ariaInvalid);
};
//# sourceMappingURL=CurrencyField.js.map