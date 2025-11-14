'use client';
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import * as React from 'react';
import { Check, X } from 'lucide-react';
import { cn } from '../utils/cn';
export const StepProgress = ({ steps, currentStep, orientation = 'horizontal', showLabels = true, onStepSelect, }) => {
    const isHorizontal = orientation === 'horizontal';
    return (_jsx("nav", { className: cn('flex', isHorizontal ? 'flex-row items-center' : 'flex-col'), "aria-label": "Form progress", children: steps.map((step, index) => {
            const isLast = index === steps.length - 1;
            return (_jsxs("div", { className: cn('flex', isHorizontal ? 'flex-row items-center' : 'flex-col'), children: [_jsx(StepIndicator, { number: index + 1, status: step.status, title: step.title, showLabel: showLabels, isActive: step.id === currentStep, onSelect: () => onStepSelect?.(step.id) }), !isLast && (_jsx(StepConnector, { orientation: orientation, isCompleted: step.status === 'completed' }))] }, step.id));
        }) }));
};
const StepIndicator = ({ number, status, title, showLabel, isActive, onSelect, }) => {
    const content = React.useMemo(() => {
        switch (status) {
            case 'completed':
                return _jsx(Check, { className: "h-4 w-4", "aria-hidden": "true" });
            case 'error':
                return _jsx(X, { className: "h-4 w-4", "aria-hidden": "true" });
            default:
                return number;
        }
    }, [number, status]);
    const handleClick = () => {
        if (status === 'completed' || status === 'error' || isActive) {
            onSelect?.();
        }
    };
    return (_jsxs("div", { className: "flex flex-col items-center text-center", children: [_jsx("button", { type: "button", onClick: handleClick, disabled: !onSelect || (!isActive && status === 'upcoming'), className: cn('flex h-10 w-10 items-center justify-center rounded-full border-2 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2', status === 'current' && 'border-primary bg-primary text-primary-foreground', status === 'completed' && 'border-primary bg-primary text-primary-foreground', status === 'upcoming' && 'border-muted-foreground/40 bg-background text-muted-foreground', status === 'error' && 'border-destructive bg-destructive text-destructive-foreground', isActive && status !== 'current' && 'ring-2 ring-primary ring-offset-2'), "aria-current": isActive ? 'step' : undefined, children: content }), showLabel ? (_jsx("span", { className: cn('mt-2 text-sm', isActive ? 'font-semibold text-foreground' : 'font-normal text-muted-foreground'), children: title })) : null] }));
};
const StepConnector = ({ orientation, isCompleted }) => {
    const isHorizontal = orientation === 'horizontal';
    return (_jsx("span", { "aria-hidden": "true", className: cn('mx-2 block transition-colors', isHorizontal ? 'h-0.5 w-12' : 'h-12 w-0.5', isCompleted ? 'bg-primary' : 'bg-muted-foreground/30') }));
};
//# sourceMappingURL=StepProgress.js.map