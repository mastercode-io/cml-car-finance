import type { DraftData } from './PersistenceManager';

export class ConflictResolver {
  static async resolveConflicts(localDraft: DraftData, remoteDraft: DraftData): Promise<DraftData> {
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

  private static detectConflicts(local: unknown, remote: unknown, path = ''): string[] {
    if (
      typeof local !== 'object' ||
      local === null ||
      typeof remote !== 'object' ||
      remote === null
    ) {
      return [];
    }

    const conflicts: string[] = [];

    Object.keys(local as Record<string, unknown>).forEach((key) => {
      const currentPath = path ? `${path}.${key}` : key;
      const localValue = (local as Record<string, unknown>)[key];

      if (!(remote as Record<string, unknown>).hasOwnProperty(key)) {
        return;
      }

      const remoteValue = (remote as Record<string, unknown>)[key];

      if (
        typeof localValue === 'object' &&
        localValue !== null &&
        typeof remoteValue === 'object' &&
        remoteValue !== null
      ) {
        conflicts.push(...this.detectConflicts(localValue, remoteValue, currentPath));
        return;
      }

      if (localValue !== remoteValue) {
        conflicts.push(currentPath);
      }
    });

    return conflicts;
  }

  private static mergeData(local: unknown, remote: unknown, conflicts: string[]): unknown {
    if (typeof remote !== 'object' || remote === null) {
      return local;
    }

    const merged: Record<string, unknown> | unknown[] = Array.isArray(remote)
      ? [...remote]
      : { ...(remote as Record<string, unknown>) };

    if (typeof local !== 'object' || local === null) {
      return merged;
    }

    Object.entries(local as Record<string, unknown>).forEach(([key, value]) => {
      const currentPath = key;
      const relatedConflicts = conflicts.filter(
        (conflict) => conflict === currentPath || conflict.startsWith(`${currentPath}.`),
      );

      if (relatedConflicts.includes(currentPath)) {
        return;
      }

      if (
        relatedConflicts.length > 0 &&
        typeof value === 'object' &&
        value !== null &&
        !Array.isArray(value)
      ) {
        const nestedConflicts = relatedConflicts
          .filter((conflict) => conflict.startsWith(`${currentPath}.`))
          .map((conflict) => conflict.slice(currentPath.length + 1));
        (merged as Record<string, unknown>)[key] = this.mergeData(
          value,
          (remote as Record<string, unknown>)[key],
          nestedConflicts,
        ) as unknown;
        return;
      }

      (merged as Record<string, unknown>)[key] = value;
    });

    return merged;
  }
}
