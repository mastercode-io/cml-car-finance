'use client';
import { jsx as _jsx } from "react/jsx-runtime";
import * as React from 'react';
import { Controller } from 'react-hook-form';
import { cn } from '../../../utils/cn';
const POSTCODE_PATTERN = '^(?:GIR ?0AA|[A-Za-z]{1,2}\\d[A-Za-z\\d]? ?\\d[A-Za-z]{2})$';
const GIR_POSTCODE_COMPACT = 'GIR0AA';
const normalizePostcode = (value) => value
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, 7);
const formatPostcode = (value, autoFormat) => {
    const normalized = normalizePostcode(value);
    if (!normalized) {
        return '';
    }
    if (normalized === GIR_POSTCODE_COMPACT) {
        return autoFormat ? 'GIR 0AA' : GIR_POSTCODE_COMPACT;
    }
    if (!autoFormat || normalized.length <= 3) {
        return normalized;
    }
    return `${normalized.slice(0, normalized.length - 3)} ${normalized.slice(-3)}`;
};
export const PostcodeField = (props) => {
    const { id, name, control, rules, disabled, readOnly, placeholder, onChange, onValueChange, onStringChange, onBlur, onFocus, className, defaultValue, value, ariaDescribedBy, ariaInvalid, ariaRequired, componentProps, autoFormat, } = props;
    const fieldId = id ?? name;
    const { autoFormat: componentAutoFormat, ...restComponentProps } = (componentProps ??
        {});
    const shouldAutoFormat = typeof autoFormat === 'boolean'
        ? autoFormat
        : typeof componentAutoFormat === 'boolean'
            ? componentAutoFormat
            : true;
    const resolvedComponentProps = restComponentProps;
    const hasExternalValue = value !== undefined;
    const emitValue = React.useCallback((nextValue) => {
        onChange?.(nextValue);
        onValueChange?.(nextValue);
        onStringChange?.(nextValue);
    }, [onChange, onStringChange, onValueChange]);
    const initialValue = hasExternalValue
        ? (value ?? '')
        : (defaultValue ?? '');
    const formattedInitial = React.useMemo(() => formatPostcode(initialValue, shouldAutoFormat), [initialValue, shouldAutoFormat]);
    const [internalValue, setInternalValue] = React.useState(formattedInitial);
    React.useEffect(() => {
        if (hasExternalValue) {
            setInternalValue(formatPostcode(value ?? '', shouldAutoFormat));
        }
    }, [hasExternalValue, shouldAutoFormat, value]);
    React.useEffect(() => {
        if (!hasExternalValue) {
            setInternalValue(formatPostcode(initialValue, shouldAutoFormat));
        }
    }, [hasExternalValue, initialValue, shouldAutoFormat]);
    const handleBlur = React.useCallback((event) => {
        onBlur?.(event);
    }, [onBlur]);
    const handleFocus = React.useCallback((event) => {
        onFocus?.(event);
    }, [onFocus]);
    const renderInput = (currentValue, onValueUpdate, invalid) => (_jsx("input", { ...resolvedComponentProps, id: fieldId, name: name, type: "text", inputMode: resolvedComponentProps.inputMode ?? 'text', autoComplete: resolvedComponentProps.autoComplete ?? 'postal-code', maxLength: resolvedComponentProps.maxLength ?? 8, pattern: resolvedComponentProps.pattern ?? POSTCODE_PATTERN, value: currentValue, placeholder: placeholder ?? resolvedComponentProps.placeholder, disabled: disabled || resolvedComponentProps.disabled, readOnly: readOnly, "aria-describedby": ariaDescribedBy, "aria-invalid": invalid, "aria-required": ariaRequired, className: cn('block w-full rounded-md border px-3 py-2 text-sm', className, invalid && 'border-destructive'), onChange: (event) => {
            const next = formatPostcode(event.target.value, shouldAutoFormat);
            onValueUpdate(next);
        }, onBlur: handleBlur, onFocus: handleFocus }));
    if (control) {
        return (_jsx(Controller, { name: name, control: control, rules: rules, defaultValue: formattedInitial, render: ({ field, fieldState }) => {
                const fieldValue = typeof field.value === 'string' ? field.value : '';
                const nextValue = formatPostcode(fieldValue, shouldAutoFormat);
                return renderInput(nextValue, (updatedValue) => {
                    field.onChange(updatedValue);
                    emitValue(updatedValue);
                }, ariaInvalid ?? Boolean(fieldState.error));
            } }));
    }
    return renderInput(hasExternalValue
        ? formatPostcode(value ?? '', shouldAutoFormat)
        : internalValue, (nextValue) => {
        if (!hasExternalValue) {
            setInternalValue(nextValue);
        }
        emitValue(nextValue);
    }, ariaInvalid);
};
//# sourceMappingURL=PostcodeField.js.map