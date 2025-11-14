import type { JSONSchema } from './json-schema.types';
import type { UnifiedFormSchema } from './schema.types';
export interface MigrationConfig {
    source: 'zod' | 'react' | 'html' | 'json';
    target: 'unified-schema';
    options?: {
        preserveComments?: boolean;
        generateTests?: boolean;
        validateOutput?: boolean;
        interactive?: boolean;
        customTransforms?: Record<string, (...args: any[]) => unknown>;
    };
}
export interface MigrationResult {
    success: boolean;
    schema?: UnifiedFormSchema;
    errors: MigrationError[];
    warnings: MigrationWarning[];
    stats: MigrationStats;
    generatedTests?: string;
}
export interface MigrationError {
    type: 'parse' | 'validation' | 'transform' | 'unknown';
    message: string;
    location?: {
        line?: number;
        column?: number;
        file?: string;
    };
    suggestion?: string;
}
export interface MigrationWarning {
    type: string;
    message: string;
    suggestion?: string;
}
export interface MigrationStats {
    fieldsConverted: number;
    validationsConverted: number;
    customLogicDetected: number;
    conversionAccuracy: number;
    estimatedEffort: 'low' | 'medium' | 'high';
}
export interface FieldMapping {
    source: string;
    target: string;
    transform?: (value: any) => any;
    validation?: JSONSchema | Record<string, unknown> | null;
    ui?: Record<string, unknown> | null;
}
//# sourceMappingURL=migration.types.d.ts.map