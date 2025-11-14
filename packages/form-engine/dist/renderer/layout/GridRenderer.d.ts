import * as React from 'react';
import type { LayoutConfig, WidgetConfig } from '../../types/ui.types';
import type { LayoutBreakpoint } from '../../types/layout.types';
export interface GridRendererProps {
    layout: LayoutConfig;
    visibleFields: string[];
    renderField: (fieldName: string) => React.ReactNode;
    widgetDefinitions: Record<string, WidgetConfig | undefined>;
    breakpointOverride?: LayoutBreakpoint;
}
export declare const GridRenderer: React.FC<GridRendererProps>;
//# sourceMappingURL=GridRenderer.d.ts.map