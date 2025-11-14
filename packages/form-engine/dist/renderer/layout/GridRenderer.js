import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import * as React from 'react';
import { cn } from '../../utils/cn';
const BREAKPOINT_SEQUENCE = ['base', 'sm', 'md', 'lg', 'xl', '2xl'];
const BREAKPOINT_WIDTHS = {
    sm: 640,
    md: 768,
    lg: 1024,
    xl: 1280,
    '2xl': 1536,
};
const BREAKPOINT_SET = new Set(BREAKPOINT_SEQUENCE);
const DEFAULT_GUTTER = 24;
const clampColumns = (value, max) => {
    if (!Number.isFinite(value) || value <= 0) {
        const safeMax = Number.isFinite(max) && max > 0 ? Math.floor(max) : 1;
        return Math.max(1, safeMax);
    }
    const rounded = Math.round(value);
    const safeMax = Number.isFinite(max) && max > 0 ? Math.floor(max) : rounded;
    return Math.max(1, Math.min(rounded, safeMax));
};
const resolveBreakpointForWidth = (width) => {
    if (Number.isNaN(width) || width <= 0)
        return 'base';
    if (width >= BREAKPOINT_WIDTHS['2xl'])
        return '2xl';
    if (width >= BREAKPOINT_WIDTHS.xl)
        return 'xl';
    if (width >= BREAKPOINT_WIDTHS.lg)
        return 'lg';
    if (width >= BREAKPOINT_WIDTHS.md)
        return 'md';
    if (width >= BREAKPOINT_WIDTHS.sm)
        return 'sm';
    return 'base';
};
const isBreakpointKeyMap = (value) => Object.keys(value).every((key) => BREAKPOINT_SET.has(key));
const resolveSpanConfig = (row, field) => {
    const { colSpan } = row;
    if (!colSpan)
        return undefined;
    if (typeof colSpan === 'number')
        return colSpan;
    if (isBreakpointKeyMap(colSpan)) {
        return colSpan;
    }
    const fieldConfig = colSpan[field];
    if (!fieldConfig)
        return undefined;
    return fieldConfig;
};
const resolveSpanForBreakpoint = (span, fallback, breakpoint, columnsByBreakpoint) => {
    const maxColumns = columnsByBreakpoint[breakpoint] ?? columnsByBreakpoint.base ?? 1;
    if (typeof span === 'number') {
        return clampColumns(span, maxColumns);
    }
    if (!span || typeof span !== 'object') {
        return clampColumns(fallback, maxColumns);
    }
    let resolved = fallback;
    for (const bp of BREAKPOINT_SEQUENCE) {
        if (span[bp] != null) {
            resolved = Number(span[bp]);
        }
        if (bp === breakpoint)
            break;
    }
    return clampColumns(resolved, maxColumns);
};
const computeColumnsByBreakpoint = (layout) => {
    const map = {
        base: 1,
        sm: 1,
        md: 1,
        lg: 1,
        xl: 1,
        '2xl': 1,
    };
    const configured = layout.breakpoints ?? {};
    const baseCandidate = configured.base ?? layout.columns ?? 1;
    map.base = clampColumns(baseCandidate, Math.max(baseCandidate, 1));
    let previous = map.base;
    for (const bp of BREAKPOINT_SEQUENCE.slice(1)) {
        const next = configured[bp];
        if (typeof next === 'number' && next > 0) {
            previous = next;
        }
        map[bp] = clampColumns(previous, previous);
    }
    return map;
};
const resolveWidgetSpan = (config) => {
    if (!config)
        return undefined;
    return config.colSpan;
};
const normalizeSections = (layout, visibleFields) => {
    const sections = (layout.sections ?? []).filter((section) => !!section && Array.isArray(section.rows) && section.rows.length > 0);
    if (sections.length > 0) {
        return sections.map((section) => ({
            ...section,
            rows: section.rows
                .filter((row) => !!row && Array.isArray(row.fields) && row.fields.length > 0)
                .map((row) => ({
                ...row,
                fields: row.fields.filter((field) => visibleFields.includes(field)),
            }))
                .filter((row) => row.fields.length > 0),
        }));
    }
    return [
        {
            id: 'default',
            rows: [
                {
                    id: 'default-row',
                    fields: visibleFields,
                },
            ],
        },
    ];
};
const rowStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(var(--grid-columns, 1), minmax(0, 1fr))',
    columnGap: 'var(--grid-gutter, 1.5rem)',
    rowGap: '1.5rem',
};
export const GridRenderer = ({ layout, visibleFields, renderField, widgetDefinitions, breakpointOverride, }) => {
    const columnsByBreakpoint = React.useMemo(() => computeColumnsByBreakpoint(layout), [layout]);
    const [activeBreakpoint, setActiveBreakpoint] = React.useState('base');
    React.useEffect(() => {
        if (breakpointOverride) {
            setActiveBreakpoint(breakpointOverride);
            return;
        }
        if (typeof window === 'undefined') {
            setActiveBreakpoint('base');
            return;
        }
        const handleResize = () => {
            setActiveBreakpoint(resolveBreakpointForWidth(window.innerWidth));
        };
        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [breakpointOverride]);
    const activeColumns = columnsByBreakpoint[activeBreakpoint] ?? columnsByBreakpoint.base ?? 1;
    const gutter = typeof layout.gutter === 'number' && layout.gutter >= 0 ? layout.gutter : DEFAULT_GUTTER;
    const containerStyle = React.useMemo(() => {
        const style = {
            '--grid-gutter': `${gutter}px`,
            '--grid-columns': String(activeColumns),
        };
        BREAKPOINT_SEQUENCE.forEach((bp) => {
            style[`--grid-columns-${bp}`] = String(columnsByBreakpoint[bp] ?? activeColumns);
        });
        return style;
    }, [gutter, activeColumns, columnsByBreakpoint]);
    const renderedFields = new Set();
    const sections = normalizeSections(layout, visibleFields);
    const sectionNodes = sections
        .map((section) => {
        const rowNodes = section.rows
            .map((row) => {
            const items = row.fields
                .map((field) => {
                const fieldNode = renderField(field);
                if (!fieldNode)
                    return null;
                renderedFields.add(field);
                const widgetConfig = widgetDefinitions[field];
                const widgetSpan = resolveWidgetSpan(widgetConfig?.layout ?? undefined);
                const rowSpan = resolveSpanConfig(row, field);
                const fallback = resolveSpanForBreakpoint(rowSpan, 1, activeBreakpoint, columnsByBreakpoint);
                const span = resolveSpanForBreakpoint(widgetSpan, fallback, activeBreakpoint, columnsByBreakpoint);
                const style = {
                    gridColumn: `span ${span} / span ${span}`,
                };
                return (_jsx("div", { style: style, className: "min-w-0", children: fieldNode }, field));
            })
                .filter((item) => item !== null);
            if (items.length === 0)
                return null;
            return (_jsx("div", { className: "grid", style: rowStyle, "data-grid-row": true, children: items }, row.id ?? row.fields.join('-')));
        })
            .filter((rowNode) => rowNode !== null);
        if (rowNodes.length === 0)
            return null;
        return (_jsxs("div", { className: "space-y-4", "data-grid-section": section.id, children: [(section.title || section.description) && (_jsxs("div", { className: "space-y-1", children: [section.title ? (_jsx("h3", { className: "text-sm font-semibold text-foreground", children: section.title })) : null, section.description ? (_jsx("p", { className: "text-sm text-muted-foreground", children: section.description })) : null] })), _jsx("div", { className: "space-y-6", children: rowNodes })] }, section.id));
    })
        .filter((sectionNode) => sectionNode !== null);
    const fallbackFields = visibleFields.filter((field) => !renderedFields.has(field));
    const fallbackContent = fallbackFields
        .map((field) => {
        const node = renderField(field);
        if (!node)
            return null;
        return _jsx(React.Fragment, { children: node }, field);
    })
        .filter(Boolean);
    return (_jsxs("div", { className: cn('space-y-6'), style: containerStyle, "data-grid-breakpoint": activeBreakpoint, "data-grid-columns": activeColumns, children: [sectionNodes, fallbackContent.length > 0 ? _jsx("div", { className: "space-y-4", children: fallbackContent }) : null] }));
};
//# sourceMappingURL=GridRenderer.js.map