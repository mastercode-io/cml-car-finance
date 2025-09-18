export interface ComputedField {
  /** JSONPath where the computed result should be stored */
  path: string;
  /** Expression evaluated using expr-eval */
  expr: string;
  /** JSONPaths that this field depends on */
  dependsOn: string[];
  /** Decimal places to round numeric results */
  round?: number;
  /** When to recompute the value */
  recompute?: 'onChange' | 'onBlur' | 'onSubmit';
  /** Whether to cache the computed value (default true) */
  cache?: boolean;
  /** Value to use when an error occurs */
  fallback?: unknown;
}

export interface ComputedFieldContext {
  data: Record<string, unknown>;
  now: () => number;
  today: () => string;
  user?: unknown;
  custom?: Record<string, (...args: unknown[]) => unknown>;
}

export interface ComputedFieldResult {
  path: string;
  value: unknown;
  error?: Error;
  dependencies: string[];
  timestamp: number;
}

export type DataSourceType = 'http' | 'static' | 'function';

export interface DataSource {
  type: DataSourceType;
  url?: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  headers?: Record<string, string>;
  body?: unknown;
  params?: Record<string, unknown>;
  cache?: 'none' | 'swr' | 'persistent';
  ttlMs?: number;
  staleWhileRevalidate?: boolean;
  retries?: number;
  retryDelay?: number;
  transform?: string | ((data: unknown) => unknown);
  fallback?: unknown;
  data?: unknown;
  fn?: string;
}

export interface CachedData {
  data: unknown;
  timestamp: number;
  etag?: string;
}

export interface DataSourceResult {
  data: unknown;
  loading: boolean;
  error?: Error;
  isValidating: boolean;
  mutate: (data?: unknown) => Promise<void>;
}

export interface DataSourceMap {
  [key: string]: DataSource;
}
