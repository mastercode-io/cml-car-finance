export class ConflictResolver {
    static async resolveConflicts(localDraft, remoteDraft) {
        const localUpdated = new Date(localDraft.metadata.updatedAt).getTime();
        const remoteUpdated = new Date(remoteDraft.metadata.updatedAt).getTime();
        if (Number.isFinite(remoteUpdated) && remoteUpdated > localUpdated) {
            return remoteDraft;
        }
        const conflicts = this.detectConflicts(localDraft.data, remoteDraft.data);
        if (conflicts.length === 0) {
            return localDraft;
        }
        const merged = this.mergeData(localDraft.data, remoteDraft.data, conflicts);
        return {
            ...localDraft,
            data: merged,
            metadata: {
                ...localDraft.metadata,
                hasConflicts: true,
                conflictFields: conflicts,
            },
        };
    }
    static detectConflicts(local, remote, path = '') {
        if (typeof local !== 'object' ||
            local === null ||
            typeof remote !== 'object' ||
            remote === null) {
            return [];
        }
        const conflicts = [];
        Object.keys(local).forEach((key) => {
            const currentPath = path ? `${path}.${key}` : key;
            const localValue = local[key];
            if (!remote.hasOwnProperty(key)) {
                return;
            }
            const remoteValue = remote[key];
            if (typeof localValue === 'object' &&
                localValue !== null &&
                typeof remoteValue === 'object' &&
                remoteValue !== null) {
                conflicts.push(...this.detectConflicts(localValue, remoteValue, currentPath));
                return;
            }
            if (localValue !== remoteValue) {
                conflicts.push(currentPath);
            }
        });
        return conflicts;
    }
    static mergeData(local, remote, conflicts) {
        if (typeof remote !== 'object' || remote === null) {
            return local;
        }
        const merged = Array.isArray(remote)
            ? [...remote]
            : { ...remote };
        if (typeof local !== 'object' || local === null) {
            return merged;
        }
        Object.entries(local).forEach(([key, value]) => {
            const currentPath = key;
            const relatedConflicts = conflicts.filter((conflict) => conflict === currentPath || conflict.startsWith(`${currentPath}.`));
            if (relatedConflicts.includes(currentPath)) {
                return;
            }
            if (relatedConflicts.length > 0 &&
                typeof value === 'object' &&
                value !== null &&
                !Array.isArray(value)) {
                const nestedConflicts = relatedConflicts
                    .filter((conflict) => conflict.startsWith(`${currentPath}.`))
                    .map((conflict) => conflict.slice(currentPath.length + 1));
                merged[key] = this.mergeData(value, remote[key], nestedConflicts);
                return;
            }
            merged[key] = value;
        });
        return merged;
    }
}
//# sourceMappingURL=ConflictResolver.js.map