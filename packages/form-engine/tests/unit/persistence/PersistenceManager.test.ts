import localforage from 'localforage';

import { PersistenceManager, type DraftData } from '@form-engine/persistence/PersistenceManager';

describe('PersistenceManager', () => {
  beforeEach(async () => {
    jest.useFakeTimers();
    const store = localforage.createInstance({ name: 'FormBuilder', storeName: 'drafts' });
    await store.clear();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('saves and loads drafts with autosave enabled', async () => {
    const manager = new PersistenceManager({
      formId: 'test-form',
      schemaVersion: '1.0.0',
      allowAutosave: true,
    });

    const data = { field: 'value' };
    await manager.saveDraft(data, 'step-1', ['step-0'], { immediate: true, manual: true });
    await manager.flushPendingSaves();

    const draft = await manager.loadDraft();
    expect(draft?.data).toEqual(data);
    expect(draft?.currentStep).toBe('step-1');
  });

  it('encrypts data when configured for high sensitivity', async () => {
    const manager = new PersistenceManager({
      formId: 'secure-form',
      schemaVersion: '1.0.0',
      allowAutosave: true,
      sensitivity: 'high',
      encryptionKey: 'secret-key',
    });

    const sensitiveData = { ssn: '123-45-6789' };
    await manager.saveDraft(sensitiveData, 'security', [], { immediate: true, manual: true });
    await manager.flushPendingSaves();

    const rawStore = localforage.createInstance({ name: 'FormBuilder', storeName: 'drafts' });
    const stored = (await rawStore.getItem('secure-form:1.0.0')) as DraftData | null;

    expect(stored).not.toBeNull();
    expect(stored?.metadata.isEncrypted).toBe(true);
    expect(stored?.data).not.toEqual(sensitiveData);

    const decrypted = await manager.loadDraft();
    expect(decrypted?.data).toEqual(sensitiveData);
  });

  it('cleans up expired drafts during maintenance', async () => {
    const manager = new PersistenceManager({
      formId: 'expired-form',
      schemaVersion: '1.0.0',
      allowAutosave: true,
      ttlDays: -1,
    });

    await manager.saveDraft({ field: 'value' }, 'step', [], { immediate: true, manual: true });
    await manager.flushPendingSaves();

    await (manager as unknown as { cleanExpiredDrafts: () => Promise<void> }).cleanExpiredDrafts();

    const draft = await manager.loadDraft();
    expect(draft).toBeNull();
  });
});
