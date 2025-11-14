import type { DataSource } from '../types';
type Fetcher = (source: DataSource, params?: Record<string, unknown>) => Promise<unknown>;
type DataSourceFunction = (params?: Record<string, unknown>) => unknown | Promise<unknown>;
export declare class DataSourceManager {
    private readonly cache;
    private readonly fetchers;
    private readonly functionRegistry;
    private readonly jsonPath;
    constructor();
    fetch(source: DataSource, params?: Record<string, unknown>): Promise<unknown>;
    registerFetcher(type: string, fetcher: Fetcher): void;
    registerFunction(name: string, fn: DataSourceFunction): void;
    clearCache(): void;
    private registerDefaultFetchers;
    private fetchWithRetry;
    private httpFetcher;
    private staticFetcher;
    private functionFetcher;
    private applyTransform;
    private getCacheKey;
    private setCache;
    private isExpired;
    private delay;
    private interpolateUrl;
}
export {};
//# sourceMappingURL=DataSourceManager.d.ts.map