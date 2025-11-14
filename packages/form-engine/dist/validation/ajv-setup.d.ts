import { type ValidateFunction } from 'ajv';
import type { JSONSchema, ValidationOptions, ValidationResult } from '../types';
export interface PerformanceMetrics {
    p50: number;
    p95: number;
    p99: number;
    avg: number;
}
export declare class ValidationEngine {
    private ajv;
    private compiledSchemas;
    private performanceMetrics;
    constructor();
    private registerCustomFormats;
    private registerCustomKeywords;
    compile(schema: JSONSchema): ValidateFunction;
    validate(schema: JSONSchema, data: unknown, options?: ValidationOptions): Promise<ValidationResult>;
    getPerformanceMetrics(schemaId: string): PerformanceMetrics;
    private trackPerformance;
    private formatErrors;
    private getErrorMessage;
}
//# sourceMappingURL=ajv-setup.d.ts.map