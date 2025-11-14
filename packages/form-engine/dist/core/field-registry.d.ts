import type React from 'react';
import type { FieldProps } from '../components/fields/types';
import type { WidgetType } from '../types';
export interface FieldComponent<TProps extends FieldProps = FieldProps> {
    component: React.ComponentType<TProps>;
    defaultProps?: Partial<TProps>;
    validator?: (value: unknown) => boolean | string;
    formatter?: (value: unknown) => unknown;
    parser?: (value: unknown) => unknown;
}
export declare class FieldRegistry {
    private static instance;
    private fields;
    static getInstance(): FieldRegistry;
    static reset(): void;
    register(type: WidgetType, field: FieldComponent): void;
    get(type: WidgetType): FieldComponent | undefined;
    getComponent(type: WidgetType): React.ComponentType<FieldProps>;
    list(): WidgetType[];
}
export declare function initializeFieldRegistry(): FieldRegistry;
//# sourceMappingURL=field-registry.d.ts.map