import { useMemo } from 'react';
import useSWR, { SWRConfiguration } from 'swr';

import { DataSourceManager } from '../datasources/DataSourceManager';
import type { DataSource, DataSourceResult } from '../types';

export function useDataSource(
  key: string | null,
  source?: DataSource,
  params?: Record<string, unknown>,
  config?: SWRConfiguration,
): DataSourceResult {
  const manager = useMemo(() => new DataSourceManager(), []);

  const swrKey = source && key ? [key, source.type, source.url, source.fn, params] : null;

  const { data, error, isValidating, mutate } = useSWR(
    swrKey,
    () => (source ? manager.fetch(source, params) : null),
    config,
  );

  return {
    data: data ?? source?.fallback ?? null,
    loading: Boolean(source) && !error && data === undefined,
    error: (error as Error) ?? undefined,
    isValidating: Boolean(isValidating),
    mutate: async (nextData?: unknown) => {
      if (nextData !== undefined) {
        await mutate(nextData as any, false);
        return;
      }
      await mutate();
    },
  };
}
