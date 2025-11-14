import type { UnifiedFormSchema } from '../types';
export declare class SchemaComposer {
    private schemas;
    constructor(initialSchemas?: UnifiedFormSchema[]);
    register(schema: UnifiedFormSchema): void;
    loadSchema(id: string, loader: (id: string) => Promise<UnifiedFormSchema>): Promise<UnifiedFormSchema>;
    compose(schema: UnifiedFormSchema): UnifiedFormSchema;
    private mergeSchemas;
    private mergeWithOverrides;
    private mergeSteps;
    private mergeTransitions;
    private deepMerge;
    private extractOverrideDirective;
    private isPlainObject;
    private isOverrideExempt;
}
//# sourceMappingURL=schema-composer.d.ts.map