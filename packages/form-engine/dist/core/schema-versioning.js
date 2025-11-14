export class SchemaVersionManager {
    versions = new Map();
    registerVersion(id, version) {
        const existing = this.versions.get(id) ?? [];
        const filtered = existing.filter(item => item.version !== version.version);
        filtered.push(version);
        filtered.sort((a, b) => this.compareVersions(a.version, b.version));
        this.versions.set(id, filtered);
    }
    getLatestVersion(id) {
        const versions = this.versions.get(id);
        return versions?.[versions.length - 1];
    }
    migrateData(id, data, fromVersion, toVersion) {
        if (fromVersion === toVersion) {
            return data;
        }
        const path = this.getMigrationPath(id, fromVersion, toVersion);
        return path.reduce((acc, migration) => migration.transform(acc), data);
    }
    getMigrationPath(id, fromVersion, toVersion) {
        const versions = this.versions.get(id) || [];
        const migrations = [];
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
    compareVersions(a, b) {
        const parse = (version) => version.split('.').map(part => Number(part) || 0);
        const [aMajor, aMinor, aPatch] = parse(a);
        const [bMajor, bMinor, bPatch] = parse(b);
        if (aMajor !== bMajor)
            return aMajor - bMajor;
        if (aMinor !== bMinor)
            return aMinor - bMinor;
        return aPatch - bPatch;
    }
}
//# sourceMappingURL=schema-versioning.js.map