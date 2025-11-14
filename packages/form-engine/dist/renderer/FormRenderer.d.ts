import * as React from 'react';
import type { UnifiedFormSchema, LayoutBreakpoint } from '../types';
export interface FormRendererProps {
    schema: UnifiedFormSchema;
    initialData?: Record<string, unknown>;
    onSubmit: (data: any) => void | Promise<void>;
    onStepChange?: (stepId: string) => void;
    onFieldChange?: (field: string, value: unknown) => void;
    onValidationError?: (errors: unknown) => void;
    mode?: 'create' | 'edit' | 'view';
    className?: string;
    gridBreakpointOverride?: LayoutBreakpoint;
}
export declare const FormRenderer: React.FC<FormRendererProps>;
//# sourceMappingURL=FormRenderer.d.ts.map