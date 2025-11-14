import type { MigrationConfig, MigrationResult } from '../types';
export declare class ReactFormMigrator {
    migrateComponent(componentCode: string, options?: MigrationConfig['options']): Promise<MigrationResult>;
    private extractFormStructure;
    private getTagName;
    private isFormField;
    private extractFieldInfo;
    private extractAttributeValue;
    private transformOptionObject;
    private extractExpressionValue;
    private isRegisterCall;
    private buildSchemaFromStructure;
    private inferFieldSchema;
    private inferWidgetConfig;
    private hasRequiredValidation;
    private toLabel;
    private calculateStats;
}
//# sourceMappingURL=ReactFormMigrator.d.ts.map