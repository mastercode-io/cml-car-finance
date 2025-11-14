import { z } from 'zod';
import type { MigrationConfig, MigrationResult } from '../types';
export declare class ZodMigrator {
    private warnings;
    private errors;
    private fieldMappings;
    private generatedTests?;
    migrate(zodSchema: z.ZodSchema<any>, options?: MigrationConfig['options']): Promise<MigrationResult>;
    private analyzeZodSchema;
    private describeArrayItem;
    private unwrapType;
    private extractStringValidations;
    private extractNumberValidations;
    private buildUnifiedSchema;
    private groupFieldsIntoSteps;
    private convertFieldToJsonSchema;
    private inferUIWidget;
    private prettyLabel;
    private generateStepTitle;
    private validateSchema;
    private generateMigrationTests;
    private calculateStats;
    private reset;
}
//# sourceMappingURL=ZodMigrator.d.ts.map