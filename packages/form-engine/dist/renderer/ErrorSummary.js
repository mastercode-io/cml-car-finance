'use client';
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import * as React from 'react';
import { flattenFieldErrors } from './utils';
export const ErrorSummary = ({ errors, onFocusField }) => {
    const items = React.useMemo(() => flattenFieldErrors(errors), [errors]);
    if (items.length === 0) {
        return null;
    }
    return (_jsxs("section", { role: "alert", "aria-live": "polite", className: "rounded-md border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive", children: [_jsx("p", { className: "font-semibold", children: "Please review the highlighted fields" }), _jsx("ul", { className: "mt-2 space-y-1", children: items.map((item) => (_jsxs("li", { children: [_jsx("button", { type: "button", onClick: () => onFocusField?.(item.name), className: "font-medium underline decoration-dotted underline-offset-2 hover:decoration-solid focus:outline-none focus-visible:ring-2 focus-visible:ring-primary", children: item.name }), item.message ? `: ${item.message}` : null] }, item.name))) })] }));
};
//# sourceMappingURL=ErrorSummary.js.map