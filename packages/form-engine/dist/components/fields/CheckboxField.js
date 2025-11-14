'use client';
import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import * as React from 'react';
import { Controller } from 'react-hook-form';
import { Checkbox } from '../ui/checkbox';
import { cn } from '../../utils/cn';
export const CheckboxField = (props) => {
    const { id, name, control, rules, disabled, onChange, onValueChange, onCheckedChange, onBlur, onFocus, defaultValue, value, ariaDescribedBy, ariaInvalid, ariaRequired, componentProps, className, readOnly, } = props;
    const fieldId = id ?? name;
    const resolvedComponentProps = (componentProps ?? {});
    const { className: componentClassName, onCheckedChange: componentOnCheckedChange, onBlur: componentOnBlur, onFocus: componentOnFocus, disabled: componentDisabled, defaultChecked: componentDefaultChecked, ...restComponentProps } = resolvedComponentProps;
    const handleBlur = React.useCallback((event) => {
        onBlur?.(event);
    }, [onBlur]);
    const handleFocus = React.useCallback((event) => {
        onFocus?.(event);
    }, [onFocus]);
    const handleChange = React.useCallback((nextValue) => {
        const resolved = nextValue === undefined ? false : nextValue;
        onChange?.(resolved);
        onValueChange?.(resolved);
        onCheckedChange?.(resolved);
    }, [onChange, onCheckedChange, onValueChange]);
    const hasExternalValue = value !== undefined;
    const [internalValue, setInternalValue] = React.useState(() => hasExternalValue ? value === true : Boolean(defaultValue));
    React.useEffect(() => {
        if (hasExternalValue) {
            setInternalValue(Boolean(value));
        }
    }, [hasExternalValue, value]);
    const isDisabled = disabled ?? componentDisabled;
    if (control) {
        return (_jsx(Controller, { name: name, control: control, rules: rules, defaultValue: ariaRequired ? undefined : Boolean(defaultValue), render: ({ field }) => {
                const checked = field.value === true;
                return (_jsxs(_Fragment, { children: [_jsx(Checkbox, { ...restComponentProps, id: fieldId, name: name, checked: checked, disabled: isDisabled, "aria-describedby": ariaDescribedBy, "aria-invalid": ariaInvalid, "aria-required": ariaRequired, className: cn(componentClassName, className), onCheckedChange: (nextState) => {
                                componentOnCheckedChange?.(nextState);
                                if (readOnly) {
                                    return;
                                }
                                const nextValue = nextState === true;
                                const valueToStore = nextValue ? true : ariaRequired ? undefined : false;
                                field.onChange(valueToStore);
                                handleChange(valueToStore);
                            }, onBlur: (event) => {
                                componentOnBlur?.(event);
                                field.onBlur();
                                handleBlur(event);
                            }, onFocus: (event) => {
                                componentOnFocus?.(event);
                                handleFocus(event);
                            }, ref: field.ref }), _jsx("input", { type: "hidden", name: name, value: checked ? 'true' : 'false' })] }));
            } }));
    }
    const resolvedChecked = hasExternalValue ? value === true : internalValue;
    const defaultCheckedValue = componentDefaultChecked ?? Boolean(defaultValue);
    return (_jsxs(_Fragment, { children: [_jsx(Checkbox, { ...restComponentProps, id: fieldId, name: name, checked: resolvedChecked, defaultChecked: hasExternalValue ? undefined : defaultCheckedValue, disabled: isDisabled, "aria-describedby": ariaDescribedBy, "aria-invalid": ariaInvalid, "aria-required": ariaRequired, className: cn(componentClassName, className), onCheckedChange: (nextState) => {
                    componentOnCheckedChange?.(nextState);
                    if (readOnly) {
                        return;
                    }
                    const nextValue = nextState === true;
                    const valueToStore = nextValue ? true : ariaRequired ? undefined : false;
                    if (!hasExternalValue) {
                        setInternalValue(Boolean(valueToStore));
                    }
                    handleChange(valueToStore);
                }, onBlur: (event) => {
                    componentOnBlur?.(event);
                    handleBlur(event);
                }, onFocus: (event) => {
                    componentOnFocus?.(event);
                    handleFocus(event);
                } }), _jsx("input", { type: "hidden", name: name, value: resolvedChecked ? 'true' : 'false' })] }));
};
//# sourceMappingURL=CheckboxField.js.map