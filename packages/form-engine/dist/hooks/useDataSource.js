import { useMemo } from 'react';
import useSWR from 'swr';
import { DataSourceManager } from '../datasources/DataSourceManager';
export function useDataSource(key, source, params, config) {
    const manager = useMemo(() => new DataSourceManager(), []);
    const swrKey = source && key ? [key, source.type, source.url, source.fn, params] : null;
    const { data, error, isValidating, mutate } = useSWR(swrKey, () => (source ? manager.fetch(source, params) : null), config);
    return {
        data: data ?? source?.fallback ?? null,
        loading: Boolean(source) && !error && data === undefined,
        error: error ?? undefined,
        isValidating: Boolean(isValidating),
        mutate: async (nextData) => {
            if (nextData !== undefined) {
                await mutate(nextData, false);
                return;
            }
            await mutate();
        },
    };
}
//# sourceMappingURL=useDataSource.js.map