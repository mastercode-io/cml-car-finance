import type { CSSProperties } from 'react';

import type {
  GridLayoutFieldPlacement,
  LayoutBreakpoint,
  LayoutConfig,
  ResponsiveLayoutValue,
  WidgetLayoutConfig,
} from '../../types';

export const BREAKPOINT_SEQUENCE: LayoutBreakpoint[] = ['base', 'sm', 'md', 'lg', 'xl'];

export const DEFAULT_BREAKPOINT_WIDTHS: Record<Exclude<LayoutBreakpoint, 'base'>, number> = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
};

export const DEFAULT_GRID_COLUMNS = 4;
export const DEFAULT_GRID_GUTTER = 16;
export const DEFAULT_GRID_ROW_GAP = 16;

export type FieldLayoutHints = {
  colSpan?: ResponsiveLayoutValue<number>;
  order?: ResponsiveLayoutValue<number>;
  hide?: ResponsiveLayoutValue<boolean>;
};

const isResponsiveObject = <T>(value: unknown): value is ResponsiveLayoutValue<T> => {
  if (!value || typeof value !== 'object') {
    return false;
  }
  const keys = Object.keys(value as Record<string, unknown>);
  return keys.some((key) => BREAKPOINT_SEQUENCE.includes(key as LayoutBreakpoint));
};

export const normalizeResponsiveValue = <T>(
  value: ResponsiveLayoutValue<T> | T | undefined,
): ResponsiveLayoutValue<T> | undefined => {
  if (value === undefined) {
    return undefined;
  }

  if (isResponsiveObject<T>(value)) {
    return value as ResponsiveLayoutValue<T>;
  }

  return { base: value as T };
};

export const mergeResponsiveValues = <T>(
  base?: ResponsiveLayoutValue<T>,
  override?: ResponsiveLayoutValue<T>,
): ResponsiveLayoutValue<T> | undefined => {
  const result: ResponsiveLayoutValue<T> = {};
  let hasValue = false;

  for (const breakpoint of BREAKPOINT_SEQUENCE) {
    const overrideValue = override?.[breakpoint];
    if (overrideValue !== undefined) {
      result[breakpoint] = overrideValue;
      hasValue = true;
      continue;
    }

    const baseValue = base?.[breakpoint];
    if (baseValue !== undefined) {
      result[breakpoint] = baseValue;
      hasValue = true;
    }
  }

  return hasValue ? result : undefined;
};

const extractLayoutHints = (
  input?: GridLayoutFieldPlacement | WidgetLayoutConfig,
): FieldLayoutHints => {
  if (!input) {
    return {};
  }

  return {
    colSpan: normalizeResponsiveValue<number>(input.colSpan),
    order: normalizeResponsiveValue<number>(input.order),
    hide: normalizeResponsiveValue<boolean>(input.hide),
  };
};

export const mergeLayout = (
  base?: GridLayoutFieldPlacement,
  override?: WidgetLayoutConfig,
): FieldLayoutHints => {
  const baseHints = extractLayoutHints(base);
  const overrideHints = extractLayoutHints(override);

  return {
    colSpan: mergeResponsiveValues(baseHints.colSpan, overrideHints.colSpan),
    order: mergeResponsiveValues(baseHints.order, overrideHints.order),
    hide: mergeResponsiveValues(baseHints.hide, overrideHints.hide),
  };
};

export const resolveBreakpoint = <T>(
  config: ResponsiveLayoutValue<T> | undefined,
  breakpoint: LayoutBreakpoint,
): T | undefined => {
  if (!config) {
    return undefined;
  }

  const startIndex = BREAKPOINT_SEQUENCE.indexOf(breakpoint);
  for (let index = startIndex; index >= 0; index -= 1) {
    const key = BREAKPOINT_SEQUENCE[index];
    const value = config[key];
    if (value !== undefined) {
      return value;
    }
  }

  return undefined;
};

const ensureResponsive = <T>(
  value: ResponsiveLayoutValue<T> | T | undefined,
  fallback: T,
  options?: { baseFallback?: T },
): ResponsiveLayoutValue<T> => {
  const normalized = normalizeResponsiveValue<T>(value) ?? {};
  const baseValue = normalized.base ?? options?.baseFallback ?? fallback;

  return {
    base: baseValue,
    sm: normalized.sm,
    md: normalized.md,
    lg: normalized.lg,
    xl: normalized.xl,
  };
};

export interface GridStylesResult {
  columns: number;
  gutter: number;
  rowGap: number;
  style: CSSProperties & Record<string, string>;
}

export const computeGridStyles = (
  layout: LayoutConfig | undefined,
  breakpoint: LayoutBreakpoint,
): GridStylesResult => {
  const columnsConfig = ensureResponsive(layout?.columns, DEFAULT_GRID_COLUMNS, {
    baseFallback: 1,
  });
  const gutterConfig = ensureResponsive(layout?.gutter, DEFAULT_GRID_GUTTER);
  const rowGapConfig = ensureResponsive(layout?.rowGap, DEFAULT_GRID_ROW_GAP);

  const breakpointColumns: Record<LayoutBreakpoint, number> = {
    base: DEFAULT_GRID_COLUMNS,
    sm: DEFAULT_GRID_COLUMNS,
    md: DEFAULT_GRID_COLUMNS,
    lg: DEFAULT_GRID_COLUMNS,
    xl: DEFAULT_GRID_COLUMNS,
  };

  for (const key of BREAKPOINT_SEQUENCE) {
    const resolved = resolveBreakpoint(columnsConfig, key) ?? columnsConfig.base ?? DEFAULT_GRID_COLUMNS;
    breakpointColumns[key] = Math.max(1, Math.round(resolved));
  }

  const rawColumns = breakpointColumns[breakpoint];
  const rawGutter = resolveBreakpoint(gutterConfig, breakpoint) ?? gutterConfig.base ?? DEFAULT_GRID_GUTTER;
  const rawRowGap = resolveBreakpoint(rowGapConfig, breakpoint) ?? rowGapConfig.base ?? DEFAULT_GRID_ROW_GAP;

  const columns = Math.max(1, Math.round(rawColumns));
  const gutter = Math.max(0, Math.round(rawGutter));
  const rowGap = Math.max(0, Math.round(rawRowGap));

  const style: CSSProperties & Record<string, string> = {
    display: 'grid',
    gridTemplateColumns: 'repeat(var(--cols), minmax(0, 1fr))',
    columnGap: 'var(--gutter)',
    rowGap: 'var(--rowgap)',
  };

  style['--cols'] = String(columns);
  style['--gutter'] = `${gutter}px`;
  style['--rowgap'] = `${rowGap}px`;

  for (const key of BREAKPOINT_SEQUENCE) {
    style[`--cols-${key}`] = String(breakpointColumns[key]);
  }

  return { columns, gutter, rowGap, style };
};

export interface ItemStyleResult {
  span: number;
  order?: number;
  style: CSSProperties;
}

export const computeItemStyles = (
  layout: FieldLayoutHints,
  breakpoint: LayoutBreakpoint,
  totalColumns: number,
): ItemStyleResult => {
  const resolvedSpan = resolveBreakpoint(layout.colSpan, breakpoint) ?? layout.colSpan?.base ?? 1;
  const resolvedOrder = resolveBreakpoint(layout.order, breakpoint) ?? layout.order?.base;
  const span = Math.min(Math.max(1, Math.round(resolvedSpan ?? 1)), Math.max(1, totalColumns));

  const style: CSSProperties = {
    gridColumn: `span ${span} / span ${span}`,
  };

  if (typeof resolvedOrder === 'number' && Number.isFinite(resolvedOrder)) {
    style.order = resolvedOrder;
  }

  return {
    span,
    order: typeof resolvedOrder === 'number' && Number.isFinite(resolvedOrder)
      ? resolvedOrder
      : undefined,
    style,
  };
};

export const inferBreakpointFromWidth = (
  width: number,
  overrides?: Partial<Record<Exclude<LayoutBreakpoint, 'base'>, number>>,
): LayoutBreakpoint => {
  const thresholds = { ...DEFAULT_BREAKPOINT_WIDTHS, ...(overrides ?? {}) };
  if (thresholds.xl && width >= thresholds.xl) {
    return 'xl';
  }
  if (thresholds.lg && width >= thresholds.lg) {
    return 'lg';
  }
  if (thresholds.md && width >= thresholds.md) {
    return 'md';
  }
  if (thresholds.sm && width >= thresholds.sm) {
    return 'sm';
  }
  return 'base';
};
