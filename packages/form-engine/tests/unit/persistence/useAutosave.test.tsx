import { act, renderHook, waitFor } from '@testing-library/react';

import { useAutosave } from '@form-engine/persistence/useAutosave';

describe('useAutosave', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('autosaves form data on interval when enabled', async () => {
    const { result } = renderHook(() =>
      useAutosave('autosave-form', '1.0.0', { field: 'value' }, 'step1', [], {
        enabled: true,
        interval: 100,
      }),
    );

    await act(async () => {
      jest.advanceTimersByTime(150);
      await Promise.resolve();
    });

    await waitFor(() => {
      expect(result.current.saveCount).toBeGreaterThan(0);
      expect(result.current.isSaving).toBe(false);
    });
  });

  it('does not autosave when disabled', async () => {
    const { result } = renderHook(() =>
      useAutosave('autosave-form', '1.0.0', { field: 'value' }, 'step1', [], {
        enabled: false,
        interval: 100,
      }),
    );

    await act(async () => {
      jest.advanceTimersByTime(300);
      await Promise.resolve();
    });

    expect(result.current.saveCount).toBe(0);
  });
});
