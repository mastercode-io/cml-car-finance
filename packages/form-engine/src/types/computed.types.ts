export interface ComputedField {
  path: string;
  expr: string;
  dependsOn: string[];
  round?: number;
  recompute?: 'onChange' | 'onBlur' | 'onSubmit';
  cache?: boolean;
  fallback?: unknown;
}

export type DataSourceType = 'http' | 'static' | 'function';

export interface DataSource {
  type: DataSourceType;
  url?: string;
  method?: 'GET' | 'POST';
  headers?: Record<string, string>;
  cache?: 'none' | 'swr' | 'persistent';
  ttlMs?: number;
  retries?: number;
  fallback?: unknown;
  transform?: string;
  functionName?: string;
  data?: unknown;
}

export interface DataSourceMap {
  [key: string]: DataSource;
}
