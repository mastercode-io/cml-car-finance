const { applyPin, trimVersions } = require('../../../../../scripts/pin-form-schema-version');

describe('pin-form-schema-version runbook helpers', () => {
  const baseManifest = {
    formId: 'claims-intake',
    currentVersion: '2024.09.3',
    pinnedVersion: null,
    versions: [
      { version: '2024.09.3', url: 'https://cdn.example/forms/2024.09.3.json' },
      { version: '2024.09.2', url: 'https://cdn.example/forms/2024.09.2.json' },
      { version: '2024.09.1', url: 'https://cdn.example/forms/2024.09.1.json' },
      { version: '2024.08.5', url: 'https://cdn.example/forms/2024.08.5.json' },
    ],
  };

  afterEach(() => {
    jest.useRealTimers();
  });

  it('pins a requested version and respects retention limits', () => {
    jest.useFakeTimers().setSystemTime(new Date('2024-10-01T10:15:00Z'));
    const { manifest, removedVersions } = applyPin(baseManifest, {
      pin: '2024.09.2',
      keep: 3,
    });

    expect(manifest.pinnedVersion).toBe('2024.09.2');
    expect(manifest.lastRollbackAt).toBe('2024-10-01T10:15:00.000Z');
    expect(manifest.versions.map((entry) => entry.version)).toEqual([
      '2024.09.3',
      '2024.09.2',
      '2024.09.1',
    ]);
    expect(removedVersions).toEqual(['2024.08.5']);
  });

  it('ensures the pinned version is retained even if outside the keep window', () => {
    const { manifest } = applyPin(baseManifest, {
      pin: '2024.08.5',
      keep: 2,
    });

    expect(manifest.pinnedVersion).toBe('2024.08.5');
    expect(manifest.versions.map((entry) => entry.version)).toEqual(['2024.08.5', '2024.09.3']);
  });

  it('can clear a pinned version without mutating history order', () => {
    const withPinned = {
      ...baseManifest,
      pinnedVersion: '2024.09.2',
    };

    const { manifest } = applyPin(withPinned, {
      clear: true,
      keep: 3,
    });

    expect(manifest.pinnedVersion).toBeNull();
    expect(manifest.versions.map((entry) => entry.version)).toEqual([
      '2024.09.3',
      '2024.09.2',
      '2024.09.1',
    ]);
  });

  it('trims to pinned version only when keep is zero', () => {
    const trimmed = trimVersions(baseManifest.versions, 0, '2024.09.2');
    expect(trimmed.map((entry) => entry.version)).toEqual(['2024.09.2']);
  });
});
