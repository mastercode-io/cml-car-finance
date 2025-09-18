import type { DataSource } from '../types';

interface CachedData {
  data: unknown;
  timestamp: number;
}

export class DataSourceManager {
  private cache = new Map<string, CachedData>();

  async fetch(source: DataSource, params?: Record<string, unknown>): Promise<unknown> {
    const cacheKey = this.getCacheKey(source, params);
    if (source.cache && source.cache !== 'none') {
      const cached = this.cache.get(cacheKey);
      if (cached && !this.isExpired(cached, source.ttlMs)) {
        return cached.data;
      }
    }

    const data = await this.fetchWithRetry(source, params);
    if (source.cache && source.cache !== 'none') {
      this.cache.set(cacheKey, { data, timestamp: Date.now() });
    }
    return data;
  }

  private async fetchWithRetry(source: DataSource, params?: Record<string, unknown>): Promise<unknown> {
    const retries = source.retries ?? 0;
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        if (source.type === 'http' && source.url) {
          const response = await fetch(this.interpolateUrl(source.url, params), {
            method: source.method ?? 'GET',
            headers: source.headers
          });
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
          }
          const payload = await response.json();
          return this.applyTransform(payload, source.transform);
        }
        if (source.type === 'static') {
          return source.data ?? [];
        }
        if (source.type === 'function' && source.functionName) {
          const fn = (globalThis as any)[source.functionName];
          if (typeof fn !== 'function') {
            throw new Error(`Data source function ${source.functionName} not found`);
          }
          return await fn(params);
        }
        throw new Error(`Unsupported data source type: ${source.type}`);
      } catch (error) {
        if (attempt === retries) {
          if (source.fallback !== undefined) {
            return source.fallback;
          }
          throw error;
        }
        await this.delay(Math.pow(2, attempt) * 100);
      }
    }
    return source.fallback;
  }

  private applyTransform(data: unknown, transform?: string): unknown {
    if (!transform) {
      return data;
    }
    if (transform.startsWith('$')) {
      try {
        const path = transform.slice(1).split('.');
        return path.reduce((acc: any, key) => (acc ? acc[key] : undefined), data as any);
      } catch (error) {
        console.warn('Failed to transform data source payload', error);
        return data;
      }
    }
    if (typeof (globalThis as any)[transform] === 'function') {
      return (globalThis as any)[transform](data);
    }
    return data;
  }

  private getCacheKey(source: DataSource, params?: Record<string, unknown>): string {
    return `${source.type}:${source.url ?? source.functionName ?? ''}:${JSON.stringify(params ?? {})}`;
  }

  private isExpired(entry: CachedData, ttlMs?: number): boolean {
    if (!ttlMs) {
      return false;
    }
    return Date.now() - entry.timestamp > ttlMs;
  }

  private delay(duration: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, duration));
  }

  private interpolateUrl(template: string, params?: Record<string, unknown>): string {
    if (!params) {
      return template;
    }
    return template.replace(/:([a-zA-Z0-9_]+)/g, (_, key) => {
      const value = params[key];
      return value !== undefined ? encodeURIComponent(String(value)) : '';
    });
  }
}
