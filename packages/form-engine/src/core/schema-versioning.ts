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

export class SchemaVersionManager {
  private versions: Map<string, SchemaVersion[]> = new Map();

  registerVersion(id: string, version: SchemaVersion): void {
    const existing = this.versions.get(id) ?? [];
    const filtered = existing.filter(item => item.version !== version.version);
    filtered.push(version);
    filtered.sort((a, b) => this.compareVersions(a.version, b.version));
    this.versions.set(id, filtered);
  }

  getLatestVersion(id: string): SchemaVersion | undefined {
    const versions = this.versions.get(id);
    return versions?.[versions.length - 1];
  }

  migrateData(id: string, data: any, fromVersion: string, toVersion: string): any {
    if (fromVersion === toVersion) {
      return data;
    }

    const path = this.getMigrationPath(id, fromVersion, toVersion);
    return path.reduce((acc, migration) => migration.transform(acc), data);
  }

  private getMigrationPath(id: string, fromVersion: string, toVersion: string): Migration[] {
    const versions = this.versions.get(id) || [];
    const migrations: Migration[] = [];
    let current = fromVersion;

    while (current !== toVersion) {
      const migration = versions
        .flatMap(version => version.migrations ?? [])
        .find(item => item.from === current);

      if (!migration) {
        throw new Error(`No migration path from ${fromVersion} to ${toVersion}`);
      }

      migrations.push(migration);
      current = migration.to;
    }

    return migrations;
  }

  private compareVersions(a: string, b: string): number {
    const parse = (version: string) => version.split('.').map(part => Number(part) || 0);
    const [aMajor, aMinor, aPatch] = parse(a);
    const [bMajor, bMinor, bPatch] = parse(b);

    if (aMajor !== bMajor) return aMajor - bMajor;
    if (aMinor !== bMinor) return aMinor - bMinor;
    return aPatch - bPatch;
  }
}
