import { ConflictResolver } from '@form-engine/persistence/ConflictResolver';
import type { DraftData } from '@form-engine/persistence/PersistenceManager';

function createDraft(partial: Partial<DraftData>): DraftData {
  return {
    formId: 'test-form',
    schemaVersion: '1.0.0',
    payloadVersion: '1.0.0',
    data: {},
    currentStep: 'step1',
    completedSteps: [],
    metadata: {
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
      deviceId: 'device',
      sessionId: 'session',
      saveCount: 1,
      isComplete: false,
      isEncrypted: false,
    },
    ...partial,
    metadata: {
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
      deviceId: 'device',
      sessionId: 'session',
      saveCount: 1,
      isComplete: false,
      isEncrypted: false,
      ...(partial.metadata ?? {}),
    },
  };
}

describe('ConflictResolver', () => {
  it('returns remote draft when remote is newer', async () => {
    const local = createDraft({
      data: { name: 'Local' },
      metadata: { updatedAt: '2024-01-01T00:00:00.000Z' },
    });
    const remote = createDraft({
      data: { name: 'Remote' },
      metadata: { updatedAt: '2024-01-02T00:00:00.000Z' },
    });

    const resolved = await ConflictResolver.resolveConflicts(local, remote);
    expect(resolved.data).toEqual(remote.data);
  });

  it('merges local data and flags conflicts when local is newer', async () => {
    const local = createDraft({
      data: {
        firstName: 'Ada',
        address: {
          city: 'Denver',
          zip: '80014',
        },
        preferences: {
          newsletter: true,
        },
      },
      metadata: { updatedAt: '2024-02-01T00:00:00.000Z' },
    });

    const remote = createDraft({
      data: {
        firstName: 'Ada',
        address: {
          city: 'Seattle',
          zip: '80014',
        },
        preferences: {
          newsletter: false,
        },
        email: 'ada@example.com',
      },
      metadata: { updatedAt: '2024-01-20T00:00:00.000Z' },
    });

    const resolved = await ConflictResolver.resolveConflicts(local, remote);

    expect(resolved.metadata.hasConflicts).toBe(true);
    expect(resolved.metadata.conflictFields).toEqual(
      expect.arrayContaining(['preferences.newsletter', 'address.city']),
    );
    expect(resolved.metadata.conflictFields).toHaveLength(2);
    expect(resolved.data).toMatchObject({
      firstName: 'Ada',
      address: {
        city: 'Seattle',
        zip: '80014',
      },
      preferences: {
        newsletter: false,
      },
      email: 'ada@example.com',
    });
  });
});
