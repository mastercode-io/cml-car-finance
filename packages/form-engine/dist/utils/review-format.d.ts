import type { ReactNode } from 'react';
import type { UnifiedFormSchema } from '../types';
import type { RepeaterItemConfig } from '../types/ui.types';
type WidgetConfigLike = {
    label?: string;
    options?: Array<{
        label: string;
        value: string | number;
    }>;
    fields?: RepeaterItemConfig[];
};
export declare const formatValue: (value: unknown, _fieldName: string, schema: UnifiedFormSchema, widgetConfig?: WidgetConfigLike) => ReactNode;
export {};
//# sourceMappingURL=review-format.d.ts.map