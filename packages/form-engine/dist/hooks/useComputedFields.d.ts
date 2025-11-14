import type { ComputedField } from '../types';
export declare function useComputedFields(computedFields: ComputedField[] | undefined, formData: Record<string, unknown>, onUpdate: (path: string, value: unknown) => void): {
    readonly handleFieldChange: (changedPath: string) => void;
    readonly evaluateAll: () => void;
};
//# sourceMappingURL=useComputedFields.d.ts.map