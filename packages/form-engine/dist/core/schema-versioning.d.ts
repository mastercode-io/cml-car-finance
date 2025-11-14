import type { UnifiedFormSchema } from '../types';
export interface SchemaVersion {
    version: string;
    schema: UnifiedFormSchema;
    migrations?: Migration[];
    deprecated?: boolean;
    deprecationDate?: string;
    migrateTo?: string;
}
export interface Migration {
    from: string;
    to: string;
    transform: (data: any) => any;
    description: string;
}
export declare class SchemaVersionManager {
    private versions;
    registerVersion(id: string, version: SchemaVersion): void;
    getLatestVersion(id: string): SchemaVersion | undefined;
    migrateData(id: string, data: any, fromVersion: string, toVersion: string): any;
    private getMigrationPath;
    private compareVersions;
}
//# sourceMappingURL=schema-versioning.d.ts.map