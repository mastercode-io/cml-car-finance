'use client';
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import * as React from 'react';
import { useFormContext, useFieldArray, } from 'react-hook-form';
import { cn } from '../../utils/cn';
import { FieldFactory } from './FieldFactory';
const ANNOUNCEMENT_RESET_DELAY = 2000;
const getErrorMessage = (error) => {
    if (!error)
        return undefined;
    if (typeof error === 'string')
        return error;
    if (typeof error === 'object' && error !== null && 'message' in error) {
        const msg = error.message;
        return typeof msg === 'string' ? msg : undefined;
    }
    return undefined;
};
const buildDefaultItem = (configs, fallback) => {
    const seeded = configs.reduce((acc, cfg) => {
        if (cfg.defaultValue !== undefined)
            acc[cfg.name] = cfg.defaultValue;
        return acc;
    }, {});
    return { ...(fallback ?? {}), ...seeded };
};
export const RepeaterField = (props) => {
    const { name, control, componentProps, className, disabled, readOnly, ariaDescribedBy } = props;
    const formContext = useFormContext();
    const resolvedControl = control ?? formContext?.control;
    if (!resolvedControl)
        throw new Error('RepeaterField requires a react-hook-form control.');
    const { fields: itemConfigs = [], itemLabel = 'Item', addButtonLabel, removeButtonLabel, moveUpLabel, moveDownLabel, emptyStateText = 'No items yet.', minItems, maxItems, defaultItemValue, } = (componentProps ?? {});
    // A11y live region (polite)
    const liveRegionRef = React.useRef(null);
    const listRef = React.useRef(null);
    const addButtonRef = React.useRef(null);
    const clearTimerRef = React.useRef(undefined);
    const announce = React.useCallback((message) => {
        const region = liveRegionRef.current;
        if (!region)
            return;
        region.textContent = message;
        if (typeof window !== 'undefined') {
            window.clearTimeout(clearTimerRef.current);
            clearTimerRef.current = window.setTimeout(() => {
                if (region.textContent === message)
                    region.textContent = '';
            }, ANNOUNCEMENT_RESET_DELAY);
        }
    }, []);
    React.useEffect(() => {
        return () => {
            if (typeof window !== 'undefined')
                window.clearTimeout(clearTimerRef.current);
        };
    }, []);
    const itemFieldConfigs = React.useMemo(() => Array.isArray(itemConfigs)
        ? itemConfigs.filter((cfg) => Boolean(cfg && typeof cfg.name === 'string' && cfg.component))
        : [], [itemConfigs]);
    const itemDefaults = React.useMemo(() => buildDefaultItem(itemFieldConfigs, defaultItemValue), [itemFieldConfigs, defaultItemValue]);
    const { fields, append, remove, move } = useFieldArray({
        name: name,
        control: resolvedControl,
    });
    // Enforce min items
    React.useEffect(() => {
        if (typeof minItems !== 'number' || minItems <= 0)
            return;
        if (fields.length >= minItems)
            return;
        const missing = minItems - fields.length;
        for (let i = 0; i < missing; i += 1) {
            append(itemDefaults);
        }
    }, [append, fields.length, itemDefaults, minItems]);
    // Enforce max items
    React.useEffect(() => {
        if (typeof maxItems !== 'number' || maxItems <= 0)
            return;
        if (fields.length <= maxItems)
            return;
        const extra = fields.length - maxItems;
        const idxToRemove = Array.from({ length: extra }, (_, pos) => maxItems + pos);
        remove(idxToRemove);
    }, [fields.length, maxItems, remove]);
    const canAdd = !disabled && !readOnly && (typeof maxItems !== 'number' || fields.length < maxItems);
    const canRemove = !disabled && !readOnly && (typeof minItems !== 'number' || fields.length > minItems);
    const canReorder = !disabled && !readOnly && fields.length > 1;
    const focusItemControl = React.useCallback((itemIndex) => {
        const list = listRef.current;
        if (!list)
            return;
        const item = list.querySelector(`[data-repeater-index="${itemIndex}"]`);
        if (!item)
            return;
        const primarySelectors = [
            'input:not([type="hidden"]):not([disabled]):not([tabindex="-1"])',
            'select:not([disabled]):not([tabindex="-1"])',
            'textarea:not([disabled]):not([tabindex="-1"])',
            '[role="textbox"]:not([aria-hidden="true"]):not([tabindex="-1"])',
        ];
        const fallbackSelectors = [
            'button:not([disabled]):not([tabindex="-1"])',
            '[tabindex]:not([tabindex="-1"]):not([aria-hidden="true"])',
            '[contenteditable="true"]',
        ];
        const findFocusable = (selectors) => {
            for (const selector of selectors) {
                const candidate = item.querySelector(selector);
                if (candidate)
                    return candidate;
            }
            return null;
        };
        const focusable = findFocusable(primarySelectors) ?? findFocusable(fallbackSelectors);
        focusable?.focus();
    }, []);
    const scheduleFocus = React.useCallback((callback) => {
        if (typeof window === 'undefined') {
            callback();
            return;
        }
        const { requestAnimationFrame } = window;
        if (typeof requestAnimationFrame === 'function') {
            requestAnimationFrame(() => {
                requestAnimationFrame(callback);
            });
            return;
        }
        window.setTimeout(callback, 0);
    }, []);
    const focusAddButton = React.useCallback(() => {
        addButtonRef.current?.focus();
    }, []);
    const handleAddItem = React.useCallback(() => {
        if (!canAdd)
            return;
        const nextIndex = fields.length;
        append(itemDefaults);
        announce(`${itemLabel} ${fields.length + 1} added.`);
        scheduleFocus(() => {
            focusItemControl(nextIndex);
        });
    }, [
        announce,
        append,
        canAdd,
        fields.length,
        focusItemControl,
        itemDefaults,
        itemLabel,
        scheduleFocus,
    ]);
    const handleRemoveItem = React.useCallback((index) => {
        if (!canRemove)
            return;
        const previousCount = fields.length;
        remove(index);
        announce(`${itemLabel} ${index + 1} removed.`);
        const nextCount = previousCount - 1;
        if (nextCount <= 0) {
            scheduleFocus(focusAddButton);
            return;
        }
        const nextIndex = index >= nextCount ? nextCount - 1 : index;
        scheduleFocus(() => {
            focusItemControl(nextIndex);
        });
    }, [
        announce,
        canRemove,
        fields.length,
        focusAddButton,
        focusItemControl,
        itemLabel,
        remove,
        scheduleFocus,
    ]);
    const handleMoveItem = React.useCallback((from, to) => {
        if (!canReorder)
            return;
        move(from, to);
        announce(`${itemLabel} ${from + 1} moved to position ${to + 1}.`);
        const targetIndex = Math.max(0, Math.min(to, fields.length - 1));
        scheduleFocus(() => {
            focusItemControl(targetIndex);
        });
    }, [announce, canReorder, fields.length, focusItemControl, itemLabel, move, scheduleFocus]);
    const getFieldError = React.useCallback((fieldName) => {
        if (!formContext)
            return undefined;
        const fieldState = formContext.getFieldState(fieldName, formContext.formState);
        return getErrorMessage(fieldState.error);
    }, [formContext]);
    const addLabel = addButtonLabel ?? `Add ${itemLabel}`;
    const removeLabel = removeButtonLabel ?? 'Remove';
    const moveUpBtnLabel = moveUpLabel ?? 'Move up';
    const moveDownBtnLabel = moveDownLabel ?? 'Move down';
    return (_jsxs("div", { className: cn('space-y-4', className), "data-repeater": true, children: [_jsx("div", { "aria-live": "polite", "aria-atomic": "true", className: "sr-only", ref: liveRegionRef }), fields.length === 0 ? (_jsx("div", { className: "rounded-md border border-dashed border-muted-foreground/50 p-4 text-sm text-muted-foreground", children: emptyStateText })) : (_jsx("ul", { className: "space-y-4", role: "list", ref: listRef, children: fields.map((field, index) => {
                    const itemNumber = index + 1;
                    return (_jsxs("li", { className: "rounded-md border border-border bg-muted/10 p-4 shadow-sm", "data-repeater-index": index, children: [_jsxs("div", { className: "flex flex-wrap items-start justify-between gap-2", children: [_jsxs("p", { className: "text-sm font-medium text-foreground", children: [itemLabel, " ", itemNumber] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx("button", { type: "button", className: "rounded-md border border-input px-2 py-1 text-xs font-medium text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-60", onClick: () => handleRemoveItem(index), disabled: !canRemove, children: removeLabel }), _jsx("button", { type: "button", className: "rounded-md border border-input px-2 py-1 text-xs font-medium text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-60", onClick: () => handleMoveItem(index, index - 1), disabled: !canReorder || index === 0, "aria-label": `${moveUpBtnLabel} ${itemLabel} ${itemNumber}`, children: "\u2191" }), _jsx("button", { type: "button", className: "rounded-md border border-input px-2 py-1 text-xs font-medium text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-60", onClick: () => handleMoveItem(index, index + 1), disabled: !canReorder || index === fields.length - 1, "aria-label": `${moveDownBtnLabel} ${itemLabel} ${itemNumber}`, children: "\u2193" })] })] }), _jsx("div", { className: "mt-4 space-y-4", children: itemFieldConfigs.map((cfg) => {
                                    const { component, name: itemFieldName, label, placeholder, description, helpText, className: itemClassName, options, disabled: itemDisabled, readOnly: itemReadOnly, required, ...rest } = cfg;
                                    const fieldName = `${name}.${index}.${itemFieldName}`;
                                    const nestedError = getFieldError(fieldName);
                                    return (_jsx(FieldFactory, { name: fieldName, widget: component ?? 'Text', label: label, placeholder: placeholder, description: description, helpText: helpText, className: itemClassName, disabled: disabled || itemDisabled, readOnly: readOnly || itemReadOnly, required: required, control: resolvedControl, options: options, componentProps: rest, error: nestedError }, `${field.id}-${itemFieldName}`));
                                }) })] }, field.id));
                }) })), _jsx("div", { children: _jsx("button", { type: "button", className: "rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-60", onClick: handleAddItem, disabled: !canAdd, "aria-describedby": ariaDescribedBy, ref: addButtonRef, children: addLabel }) })] }));
};
RepeaterField.displayName = 'RepeaterField';
//# sourceMappingURL=RepeaterField.js.map