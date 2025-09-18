import { DataSourceManager } from '@form-engine/datasources/DataSourceManager';
import type { DataSource } from '@form-engine/types';

describe('DataSourceManager', () => {
  let manager: DataSourceManager;
  let originalFetch: typeof fetch | undefined;

  beforeEach(() => {
    manager = new DataSourceManager();
    originalFetch = global.fetch;
  });

  afterEach(() => {
    if (originalFetch) {
      global.fetch = originalFetch;
    } else {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (global as any).fetch;
    }
  });

  it('should fetch HTTP data', async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      statusText: 'OK',
      json: async () => ({ data: 'test' }),
    });
    global.fetch = fetchMock as unknown as typeof fetch;

    const source: DataSource = {
      type: 'http',
      url: 'https://api.example.com/data',
      method: 'GET',
    };

    const result = await manager.fetch(source);
    expect(result).toEqual({ data: 'test' });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('should cache results', async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      statusText: 'OK',
      json: async () => ({ data: 'test' }),
    });
    global.fetch = fetchMock as unknown as typeof fetch;

    const source: DataSource = {
      type: 'http',
      url: 'https://api.example.com/data',
      cache: 'swr',
      ttlMs: 60000,
    };

    await manager.fetch(source);
    const cached = await manager.fetch(source);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(cached).toEqual({ data: 'test' });
  });

  it('should retry on failure', async () => {
    const fetchMock = jest
      .fn()
      .mockRejectedValueOnce(new Error('Network error'))
      .mockResolvedValue({
        ok: true,
        status: 200,
        statusText: 'OK',
        json: async () => ({ data: 'success' }),
      });

    global.fetch = fetchMock as unknown as typeof fetch;

    const source: DataSource = {
      type: 'http',
      url: 'https://api.example.com/data',
      retries: 1,
      retryDelay: 0,
    };

    const result = await manager.fetch(source);

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(result).toEqual({ data: 'success' });
  });

  it('should use fallback on final failure', async () => {
    const fetchMock = jest.fn().mockRejectedValue(new Error('Network error'));
    global.fetch = fetchMock as unknown as typeof fetch;

    const source: DataSource = {
      type: 'http',
      url: 'https://api.example.com/data',
      retries: 2,
      retryDelay: 0,
      fallback: { data: 'fallback' },
    };

    const result = await manager.fetch(source);

    expect(result).toEqual({ data: 'fallback' });
  });
});
