import { Parser } from 'expr-eval';
import type { ComputedField, ComputedFieldResult } from '../types';
export declare class ComputedFieldEngine {
    private readonly dependencies;
    private readonly computedValues;
    private readonly expressions;
    private readonly customFunctions;
    private readonly parser;
    private readonly jsonPath;
    private userContext?;
    constructor(parser?: Parser);
    registerComputedField(field: ComputedField): void;
    evaluate(field: ComputedField, data: Record<string, unknown>): ComputedFieldResult;
    evaluateAll(fields: ComputedField[], data: Record<string, unknown>): ComputedFieldResult[];
    getComputedValue(path: string): unknown;
    getAffectedFields(changedField: string): string[];
    registerCustomFunction(name: string, fn: (...args: unknown[]) => unknown): void;
    setUserContext(user: unknown): void;
    clearCache(): void;
    private registerBuiltInFunctions;
    private createContext;
    private assignContextValue;
    private parsePathSegments;
    private safeGetValue;
    private setValueAtPath;
    private topologicalSort;
    private normalizePath;
    private stripPrefix;
    private applyRounding;
}
//# sourceMappingURL=ComputedFieldEngine.d.ts.map