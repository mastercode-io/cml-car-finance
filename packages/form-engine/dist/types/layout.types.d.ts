export type LayoutBreakpoint = 'base' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
export type GridSpanDefinition = number | Partial<Record<LayoutBreakpoint, number>>;
export interface GridLayoutRow {
    id?: string;
    fields: string[];
    colSpan?: GridSpanDefinition | Record<string, GridSpanDefinition>;
    gap?: number;
}
export interface GridLayoutSection {
    id: string;
    title?: string;
    description?: string;
    rows: GridLayoutRow[];
}
export interface GridLayoutDefinition {
    type?: 'grid';
    gutter?: number;
    breakpoints?: Partial<Record<LayoutBreakpoint, number>>;
    columns?: number;
    sections?: GridLayoutSection[];
}
//# sourceMappingURL=layout.types.d.ts.map