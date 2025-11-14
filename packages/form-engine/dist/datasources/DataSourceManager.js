import * as jsonpath from 'jsonpath';
const JsonPath = jsonpath.JSONPath;
export class DataSourceManager {
    cache = new Map();
    fetchers = new Map();
    functionRegistry = new Map();
    jsonPath = new JsonPath();
    constructor() {
        this.registerDefaultFetchers();
    }
    async fetch(source, params) {
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
    registerFetcher(type, fetcher) {
        this.fetchers.set(type, fetcher);
    }
    registerFunction(name, fn) {
        this.functionRegistry.set(name, fn);
    }
    clearCache() {
        this.cache.clear();
    }
    registerDefaultFetchers() {
        this.fetchers.set('http', this.httpFetcher.bind(this));
        this.fetchers.set('static', this.staticFetcher.bind(this));
        this.fetchers.set('function', this.functionFetcher.bind(this));
    }
    async fetchWithRetry(source, params, attempt = 0) {
        const maxRetries = source.retries ?? 0;
        try {
            const fetcher = this.fetchers.get(source.type);
            if (!fetcher) {
                throw new Error(`Unknown data source type: ${source.type}`);
            }
            const data = await fetcher(source, params);
            return this.applyTransform(data, source.transform);
        }
        catch (error) {
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
    async httpFetcher(source, params) {
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
    async staticFetcher(source) {
        return source.data;
    }
    async functionFetcher(source, params) {
        if (!source.fn) {
            throw new Error('Function data source requires `fn` to be specified');
        }
        const fn = this.functionRegistry.get(source.fn);
        if (fn) {
            return fn(params);
        }
        const globalFn = globalThis[source.fn];
        if (typeof globalFn === 'function') {
            return globalFn(params);
        }
        throw new Error(`Function not found: ${source.fn}`);
    }
    applyTransform(data, transform) {
        if (!transform) {
            return data;
        }
        try {
            if (typeof transform === 'string') {
                if (typeof data !== 'object' || data === null) {
                    return data;
                }
                return this.jsonPath.value(data, transform);
            }
            return transform(data);
        }
        catch (error) {
            if (process.env.NODE_ENV !== 'test') {
                console.warn('Failed to transform data source payload', error);
            }
            return data;
        }
    }
    getCacheKey(source, params) {
        return [
            source.type,
            source.url ?? '',
            source.fn ?? '',
            JSON.stringify(params ?? {}),
            JSON.stringify(source.params ?? {}),
        ].join('|');
    }
    setCache(cacheKey, data) {
        this.cache.set(cacheKey, { data, timestamp: Date.now() });
    }
    isExpired(entry, ttlMs) {
        if (!ttlMs) {
            return false;
        }
        return Date.now() - entry.timestamp > ttlMs;
    }
    delay(duration) {
        if (duration <= 0) {
            return Promise.resolve();
        }
        return new Promise((resolve) => setTimeout(resolve, duration));
    }
    interpolateUrl(template, params) {
        return template.replace(/\{([^}]+)\}/g, (_, key) => {
            const value = params[key];
            return value !== undefined ? encodeURIComponent(String(value)) : '';
        });
    }
}
//# sourceMappingURL=DataSourceManager.js.map