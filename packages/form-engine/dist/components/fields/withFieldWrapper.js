'use client';
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import * as React from 'react';
import { cn } from '../../utils/cn';
export function withFieldWrapper(Component) {
    const Wrapped = (props) => {
        const { label, error, description, required, helpText, name, id, wrapperClassName, ariaDescribedBy, ariaInvalid, ariaRequired, ...rest } = props;
        const generatedId = React.useId();
        const fieldId = id ?? (typeof name === 'string' ? name : generatedId) ?? generatedId;
        const errorMessage = typeof error === 'string' ? error : error?.message;
        const errorId = errorMessage ? `${fieldId}-error` : undefined;
        const descriptionId = description ? `${fieldId}-description` : undefined;
        const helpId = helpText ? `${fieldId}-help` : undefined;
        const describedBy = [ariaDescribedBy, descriptionId, helpId, errorId].filter(Boolean).join(' ');
        const componentProps = {
            ...rest,
            name,
            id: fieldId,
            ariaDescribedBy: describedBy || undefined,
            ariaInvalid: ariaInvalid ?? Boolean(errorMessage),
            ariaRequired: ariaRequired ?? Boolean(required),
        };
        return (_jsxs("div", { className: cn('space-y-2', wrapperClassName), "data-field-wrapper": true, children: [label ? (_jsxs("label", { htmlFor: fieldId, className: "text-sm font-medium text-foreground", children: [label, required ? (_jsx("span", { "aria-hidden": "true", className: "ml-1 text-destructive", children: "*" })) : null] })) : null, description ? (_jsx("p", { id: descriptionId, className: "text-sm text-muted-foreground", children: description })) : null, _jsx(Component, { ...componentProps }), helpText ? (_jsx("p", { id: helpId, className: "text-xs text-muted-foreground", children: helpText })) : null, errorMessage ? (_jsx("p", { id: errorId, className: "text-sm text-destructive", role: "alert", children: errorMessage })) : null] }));
    };
    Wrapped.displayName = `WithFieldWrapper(${Component.displayName || Component.name || 'Field'})`;
    return Wrapped;
}
//# sourceMappingURL=withFieldWrapper.js.map