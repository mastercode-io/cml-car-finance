import type { Rule } from './rules.types';
import type { GridLayoutSection, GridSpanDefinition, LayoutBreakpoint } from './layout.types';
export interface UIDefinition {
    widgets: Record<string, WidgetConfig>;
    layout?: LayoutConfig;
    theme?: ThemeConfig;
}
export interface LayoutConfig {
    type?: 'single-column' | 'two-column' | 'grid';
    columns?: number;
    gutter?: number;
    breakpoints?: Partial<Record<LayoutBreakpoint, number>>;
    sections?: GridLayoutSection[];
    groups?: LayoutGroup[];
}
export interface LayoutGroup {
    id: string;
    title?: string;
    description?: string;
    fields: string[];
    visibleWhen?: Rule;
}
export interface WidgetLayoutConfig {
    colSpan?: GridSpanDefinition;
}
export interface ThemeConfig {
    brandColor?: string;
    accentColor?: string;
    density?: 'compact' | 'comfortable';
    cornerRadius?: 'none' | 'sm' | 'md' | 'lg';
    tone?: 'light' | 'dark' | 'auto';
}
export interface WidgetConfig {
    component: WidgetType;
    label: string;
    placeholder?: string;
    helpText?: string;
    description?: string;
    disabled?: boolean;
    readOnly?: boolean;
    className?: string;
    styleWhen?: Array<WidgetStyleRule>;
    validation?: WidgetValidationConfig;
    options?: Array<{
        label: string;
        value: string | number;
    }>;
    optionsFrom?: string;
    mask?: string;
    format?: string;
    autoFormat?: boolean;
    min?: number;
    max?: number;
    step?: number;
    emptyValue?: unknown;
    fields?: RepeaterItemConfig[];
    itemLabel?: string;
    addButtonLabel?: string;
    removeButtonLabel?: string;
    moveUpLabel?: string;
    moveDownLabel?: string;
    emptyStateText?: string;
    minItems?: number;
    maxItems?: number;
    defaultItemValue?: Record<string, unknown>;
    layout?: WidgetLayoutConfig;
}
export interface RepeaterItemConfig {
    name: string;
    component: WidgetType;
    label?: string;
    placeholder?: string;
    description?: string;
    helpText?: string;
    className?: string;
    options?: Array<{
        label: string;
        value: string | number;
    }>;
    disabled?: boolean;
    readOnly?: boolean;
    required?: boolean;
    defaultValue?: unknown;
    [key: string]: unknown;
}
export interface WidgetStyleRule {
    condition: Rule;
    className: string;
}
export interface WidgetValidationConfig {
    pattern?: string;
    message?: string;
    async?: boolean;
}
export type WidgetType = 'Text' | 'Number' | 'TextArea' | 'Select' | 'RadioGroup' | 'Checkbox' | 'Date' | 'FileUpload' | 'Repeater' | 'Rating' | 'Slider' | 'Currency' | 'Percentage' | 'Phone' | 'Email' | 'Postcode' | 'IBAN' | 'ColorPicker' | 'Custom';
//# sourceMappingURL=ui.types.d.ts.map