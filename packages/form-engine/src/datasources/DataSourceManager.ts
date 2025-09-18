import * as jsonpath from 'jsonpath';

import type { CachedData, DataSource } from '../types';

type JsonPathCtor = new () => {
  value<T>(obj: Record<string, unknown>, path: string, newValue?: T): T;
};

const JsonPath = (jsonpath as unknown as { JSONPath: JsonPathCtor }).JSONPath;

type Fetcher = (source: DataSource, params?: Record<string, unknown>) => Promise<unknown>;
type DataSourceFunction = (params?: Record<string, unknown>) => unknown | Promise<unknown>;

export class DataSourceManager {
  private readonly cache = new Map<string, CachedData>();
  private readonly fetchers = new Map<string, Fetcher>();
  private readonly functionRegistry = new Map<string, DataSourceFunction>();
  private readonly jsonPath = new JsonPath();

  constructor() {
    this.registerDefaultFetchers();
  }

  async fetch(source: DataSource, params?: Record<string, unknown>): Promise<unknown> {
    const cacheKey = this.getCacheKey(source, params);

    if (source.cache && source.cache !== 'none') {
      const cached = this.cache.get(cacheKey);
      if (cached && !this.isExpired(cached, source.ttlMs)) {
        return cached.data;
      }

      if (cached && source.staleWhileRevalidate) {
        void this.fetchWithRetry(source, params).then((data) => {
          this.setCache(cacheKey, data);
        });
        return cached.data;
      }
    }

    const data = await this.fetchWithRetry(source, params);

    if (source.cache && source.cache !== 'none') {
      this.setCache(cacheKey, data);
    }

    return data;
  }

  registerFetcher(type: string, fetcher: Fetcher): void {
    this.fetchers.set(type, fetcher);
  }

  registerFunction(name: string, fn: DataSourceFunction): void {
    this.functionRegistry.set(name, fn);
  }

  clearCache(): void {
    this.cache.clear();
  }

  private registerDefaultFetchers(): void {
    this.fetchers.set('http', this.httpFetcher.bind(this));
    this.fetchers.set('static', this.staticFetcher.bind(this));
    this.fetchers.set('function', this.functionFetcher.bind(this));
  }

  private async fetchWithRetry(
    source: DataSource,
    params?: Record<string, unknown>,
    attempt = 0,
  ): Promise<unknown> {
    const maxRetries = source.retries ?? 0;

    try {
      const fetcher = this.fetchers.get(source.type);
      if (!fetcher) {
        throw new Error(`Unknown data source type: ${source.type}`);
      }

      const data = await fetcher(source, params);
      return this.applyTransform(data, source.transform);
    } catch (error) {
      if (attempt < maxRetries) {
        const delayMs = source.retryDelay ?? Math.pow(2, attempt) * 100;
        await this.delay(delayMs);
        return this.fetchWithRetry(source, params, attempt + 1);
      }

      if (source.fallback !== undefined) {
        return source.fallback;
      }

      throw error;
    }
  }

  private async httpFetcher(
    source: DataSource,
    params?: Record<string, unknown>,
  ): Promise<unknown> {
    if (!source.url) {
      throw new Error('HTTP data source requires a url');
    }

    const mergedParams = { ...(source.params ?? {}), ...(params ?? {}) };
    const url = this.interpolateUrl(source.url, mergedParams);

    const method = source.method ?? 'GET';
    const shouldSendBody = method !== 'GET';
    const payload = shouldSendBody ? (source.body ?? params) : undefined;

    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(source.headers ?? {}),
      },
      body: shouldSendBody && payload !== undefined ? JSON.stringify(payload) : undefined,
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }

  private async staticFetcher(source: DataSource): Promise<unknown> {
    return source.data;
  }

  private async functionFetcher(
    source: DataSource,
    params?: Record<string, unknown>,
  ): Promise<unknown> {
    if (!source.fn) {
      throw new Error('Function data source requires `fn` to be specified');
    }

    const fn = this.functionRegistry.get(source.fn);
    if (fn) {
      return fn(params);
    }

    const globalFn = (globalThis as Record<string, unknown>)[source.fn];
    if (typeof globalFn === 'function') {
      return (globalFn as DataSourceFunction)(params);
    }

    throw new Error(`Function not found: ${source.fn}`);
  }

  private applyTransform(
    data: unknown,
    transform?: string | ((data: unknown) => unknown),
  ): unknown {
    if (!transform) {
      return data;
    }

    try {
      if (typeof transform === 'string') {
        if (typeof data !== 'object' || data === null) {
          return data;
        }
        return this.jsonPath.value(data as Record<string, unknown>, transform);
      }

      return transform(data);
    } catch (error) {
      if (process.env.NODE_ENV !== 'test') {
        console.warn('Failed to transform data source payload', error);
      }
      return data;
    }
  }

  private getCacheKey(source: DataSource, params?: Record<string, unknown>): string {
    return [
      source.type,
      source.url ?? '',
      source.fn ?? '',
      JSON.stringify(params ?? {}),
      JSON.stringify(source.params ?? {}),
    ].join('|');
  }

  private setCache(cacheKey: string, data: unknown): void {
    this.cache.set(cacheKey, { data, timestamp: Date.now() });
  }

  private isExpired(entry: CachedData, ttlMs?: number): boolean {
    if (!ttlMs) {
      return false;
    }
    return Date.now() - entry.timestamp > ttlMs;
  }

  private delay(duration: number): Promise<void> {
    if (duration <= 0) {
      return Promise.resolve();
    }
    return new Promise((resolve) => setTimeout(resolve, duration));
  }

  private interpolateUrl(template: string, params: Record<string, unknown>): string {
    return template.replace(/\{([^}]+)\}/g, (_, key) => {
      const value = params[key];
      return value !== undefined ? encodeURIComponent(String(value)) : '';
    });
  }
}
