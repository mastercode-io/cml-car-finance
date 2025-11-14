'use client';
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import * as React from 'react';
const INITIAL_METRICS = {
    stepTransitions: [],
    validations: [],
    memory: null,
};
export const PerformanceDashboard = ({ show = false }) => {
    const [metrics, setMetrics] = React.useState(INITIAL_METRICS);
    const [isVisible, setIsVisible] = React.useState(show);
    React.useEffect(() => {
        if (!isVisible || typeof performance === 'undefined') {
            return;
        }
        const interval = window.setInterval(() => {
            const navigation = performance.getEntriesByType('navigation')[0];
            const measures = performance.getEntriesByType('measure');
            setMetrics({
                pageLoad: navigation && navigation.loadEventEnd && navigation.fetchStart
                    ? navigation.loadEventEnd - navigation.fetchStart
                    : undefined,
                domReady: navigation && navigation.domContentLoadedEventEnd && navigation.fetchStart
                    ? navigation.domContentLoadedEventEnd - navigation.fetchStart
                    : undefined,
                stepTransitions: measures
                    .filter((measure) => measure.name.includes('step_'))
                    .map((measure) => ({
                    name: measure.name,
                    duration: Number(measure.duration.toFixed(2)),
                })),
                validations: measures
                    .filter((measure) => measure.name.includes('validation_'))
                    .map((measure) => ({
                    name: measure.name,
                    duration: Number(measure.duration.toFixed(2)),
                })),
                memory: performance.memory
                    ? {
                        used: ((performance.memory
                            .usedJSHeapSize || 0) / 1048576).toFixed(2),
                        total: ((performance.memory
                            .totalJSHeapSize || 0) / 1048576).toFixed(2),
                    }
                    : null,
            });
        }, 1000);
        return () => {
            window.clearInterval(interval);
        };
    }, [isVisible]);
    if (!isVisible) {
        return (_jsx("button", { type: "button", onClick: () => setIsVisible(true), style: {
                position: 'fixed',
                bottom: 16,
                right: 16,
                zIndex: 9999,
                padding: '6px 12px',
                background: '#2563eb',
                color: '#ffffff',
                border: 'none',
                borderRadius: 6,
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(37, 99, 235, 0.4)',
            }, "aria-label": "Open performance dashboard", children: "\uD83D\uDCCA Perf" }));
    }
    return (_jsxs("div", { role: "status", "aria-live": "polite", style: {
            position: 'fixed',
            bottom: 16,
            right: 16,
            width: 320,
            maxHeight: 420,
            background: '#ffffff',
            border: '1px solid rgba(15, 23, 42, 0.12)',
            borderRadius: 8,
            padding: 12,
            zIndex: 9999,
            overflowY: 'auto',
            fontSize: 12,
            fontFamily: 'ui-monospace, SFMono-Regular, SFMono, Consolas',
            boxShadow: '0 10px 30px rgba(15, 23, 42, 0.12)',
        }, children: [_jsxs("div", { style: {
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 8,
                }, children: [_jsx("h4", { style: { margin: 0, fontSize: 14 }, children: "Performance Monitor" }), _jsx("button", { type: "button", onClick: () => setIsVisible(false), "aria-label": "Close performance dashboard", style: {
                            background: 'transparent',
                            border: 'none',
                            color: '#64748b',
                            cursor: 'pointer',
                            fontSize: 16,
                            lineHeight: 1,
                        }, children: "\u00D7" })] }), _jsxs("section", { "aria-label": "Page metrics", style: { marginBottom: 12 }, children: [_jsx("strong", { children: "Page" }), _jsxs("ul", { style: { listStyle: 'none', padding: 0, margin: '6px 0 0' }, children: [_jsxs("li", { children: ["Load: ", metrics.pageLoad ? `${metrics.pageLoad.toFixed(2)}ms` : '—'] }), _jsxs("li", { children: ["DOM Ready: ", metrics.domReady ? `${metrics.domReady.toFixed(2)}ms` : '—'] })] })] }), _jsxs("section", { "aria-label": "Step transitions", style: { marginBottom: 12 }, children: [_jsx("strong", { children: "Step Transitions" }), metrics.stepTransitions.length > 0 ? (_jsx("ul", { style: { listStyle: 'none', padding: 0, margin: '6px 0 0' }, children: metrics.stepTransitions.map((step) => (_jsxs("li", { children: [step.name, ": ", step.duration, "ms"] }, step.name))) })) : (_jsx("p", { style: { margin: '6px 0 0', color: '#94a3b8' }, children: "No measurements yet" }))] }), _jsxs("section", { "aria-label": "Validation metrics", style: { marginBottom: 12 }, children: [_jsx("strong", { children: "Validations" }), metrics.validations.length > 0 ? (_jsx("ul", { style: { listStyle: 'none', padding: 0, margin: '6px 0 0' }, children: metrics.validations.map((validation) => (_jsxs("li", { children: [validation.name, ": ", validation.duration, "ms"] }, validation.name))) })) : (_jsx("p", { style: { margin: '6px 0 0', color: '#94a3b8' }, children: "No validation metrics yet" }))] }), _jsxs("section", { "aria-label": "Memory usage", children: [_jsx("strong", { children: "Memory" }), metrics.memory ? (_jsxs("ul", { style: { listStyle: 'none', padding: 0, margin: '6px 0 0' }, children: [_jsxs("li", { children: ["Used: ", metrics.memory.used, " MB"] }), _jsxs("li", { children: ["Total: ", metrics.memory.total, " MB"] })] })) : (_jsx("p", { style: { margin: '6px 0 0', color: '#94a3b8' }, children: "Memory metrics unavailable" }))] })] }));
};
//# sourceMappingURL=PerformanceDashboard.js.map