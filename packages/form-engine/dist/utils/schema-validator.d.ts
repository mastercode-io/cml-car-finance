import type { CompiledSchema, JSONSchema, UnifiedFormSchema, ValidationResult } from '../types';
export declare class SchemaValidator {
    private ajv;
    constructor();
    private registerCustomFormats;
    private registerCustomKeywords;
    validateSchema(schema: UnifiedFormSchema): ValidationResult;
    compileSchema(schema: JSONSchema): CompiledSchema;
}
//# sourceMappingURL=schema-validator.d.ts.map