# Step 8: Computed Fields & Data Sources

## Step Description
Implement the computed field evaluation system and data source management to enable dynamic field calculations and external data integration. This step adds reactive computations and data fetching capabilities to the form engine.

## Prerequisites
- Step 7 (Data Persistence) completed
- Expression evaluator library (e.g., expr-eval or mathjs)
- Caching library (SWR or React Query)
- Form renderer with field update mechanism
- JSONPath library for field references

## Detailed To-Do List

### 8.1 Install Required Dependencies
```bash
npm install --save expr-eval jsonpath swr
npm install --save-dev @types/jsonpath
```

### 8.2 Create Computed Field Types
```typescript
// src/types/computed.types.ts

export interface ComputedField {
  path: string;                          // JSONPath where to store result
  expr: string;                          // Expression to evaluate
  dependsOn: string[];                   // Field dependencies (JSONPath)
  round?: number;                        // Decimal places to round
  recompute?: 'onChange' | 'onBlur' | 'onSubmit';
  cache?: boolean;                       // Cache computation results
  fallback?: any;                        // Default value on error
}

export interface ComputedFieldContext {
  data: Record<string, any>;             // Form data
  now: () => number;                     // Current timestamp
  today: () => string;                   // Current date
  user?: any;                            // User context
  custom?: Record<string, Function>;     // Custom functions
}

export interface ComputedFieldResult {
  value: any;
  error?: Error;
  dependencies: string[];
  timestamp: number;
}
```

### 8.3 Implement Computed Field Engine
```typescript
// src/computed/ComputedFieldEngine.ts

import * as Parser from 'expr-eval';
import JSONPath from 'jsonpath';

export class ComputedFieldEngine {
  private dependencies = new Map<string, Set<string>>();
  private computedValues = new Map<string, any>();
  private expressions = new Map<string, Parser.Expression>();
  private customFunctions: Record<string, Function> = {};
  
  constructor() {
    this.registerBuiltInFunctions();
  }
  
  private registerBuiltInFunctions(): void {
    this.customFunctions = {
      // Date functions
      now: () => Date.now(),
      today: () => new Date().toISOString().split('T')[0],
      year: (date: Date) => new Date(date).getFullYear(),
      month: (date: Date) => new Date(date).getMonth() + 1,
      day: (date: Date) => new Date(date).getDate(),
      
      // Math functions
      floor: Math.floor,
      ceil: Math.ceil,
      round: Math.round,
      abs: Math.abs,
      
      // String functions
      concat: (...args: any[]) => args.join(''),
      upper: (str: string) => str?.toUpperCase(),
      lower: (str: string) => str?.toLowerCase(),
      trim: (str: string) => str?.trim(),
      
      // Array functions
      sum: (arr: number[]) => arr?.reduce((a, b) => a + b, 0),
      avg: (arr: number[]) => arr?.reduce((a, b) => a + b, 0) / arr?.length,
      count: (arr: any[]) => arr?.length || 0,
    };
  }
  
  registerComputedField(field: ComputedField): void {
    // Build dependency graph
    field.dependsOn.forEach(dep => {
      if (!this.dependencies.has(dep)) {
        this.dependencies.set(dep, new Set());
      }
      this.dependencies.get(dep)!.add(field.path);
    });
    
    // Parse and cache expression
    try {
      const expr = Parser.parse(field.expr);
      this.expressions.set(field.path, expr);
    } catch (error) {
      console.error(`Failed to parse expression for ${field.path}:`, error);
    }
  }
  
  evaluate(field: ComputedField, data: any): ComputedFieldResult {
    const startTime = performance.now();
    
    try {
      // Get cached expression
      let expr = this.expressions.get(field.path);
      if (!expr) {
        expr = Parser.parse(field.expr);
        this.expressions.set(field.path, expr);
      }
      
      // Create evaluation context
      const context = this.createContext(data, field.dependsOn);
      
      // Evaluate expression
      let result = expr.evaluate(context);
      
      // Apply rounding if specified
      if (field.round !== undefined && typeof result === 'number') {
        result = Math.round(result * Math.pow(10, field.round)) / 
                 Math.pow(10, field.round);
      }
      
      // Cache result
      if (field.cache !== false) {
        this.computedValues.set(field.path, result);
      }
      
      // Update form data
      this.setValueAtPath(data, field.path, result);
      
      return {
        value: result,
        dependencies: field.dependsOn,
        timestamp: Date.now()
      };
    } catch (error) {
      console.error(`Error evaluating ${field.path}:`, error);
      
      const fallbackValue = field.fallback ?? null;
      this.setValueAtPath(data, field.path, fallbackValue);
      
      return {
        value: fallbackValue,
        error: error as Error,
        dependencies: field.dependsOn,
        timestamp: Date.now()
      };
    }
  }
  
  private createContext(data: any, dependencies: string[]): any {
    const context: any = { ...this.customFunctions };
    
    // Extract dependent values
    dependencies.forEach(dep => {
      const key = dep.replace('$.', '');
      const value = JSONPath.value(data, dep);
      
      // Handle nested paths
      const parts = key.split('.');
      if (parts.length > 1) {
        let current = context;
        for (let i = 0; i < parts.length - 1; i++) {
          if (!current[parts[i]]) {
            current[parts[i]] = {};
          }
          current = current[parts[i]];
        }
        current[parts[parts.length - 1]] = value;
      } else {
        context[key] = value;
      }
    });
    
    return context;
  }
  
  private setValueAtPath(data: any, path: string, value: any): void {
    const cleanPath = path.replace('$.', '');
    const parts = cleanPath.split('.');
    
    let current = data;
    for (let i = 0; i < parts.length - 1; i++) {
      if (!current[parts[i]]) {
        current[parts[i]] = {};
      }
      current = current[parts[i]];
    }
    
    current[parts[parts.length - 1]] = value;
  }
  
  getAffectedFields(changedField: string): string[] {
    const affected = new Set<string>();
    const toProcess = [changedField];
    
    while (toProcess.length > 0) {
      const field = toProcess.pop()!;
      const deps = this.dependencies.get(field);
      
      if (deps) {
        deps.forEach(dep => {
          if (!affected.has(dep)) {
            affected.add(dep);
            toProcess.push(dep);
          }
        });
      }
    }
    
    return Array.from(affected);
  }
  
  evaluateAll(fields: ComputedField[], data: any): void {
    // Sort fields by dependency order
    const sorted = this.topologicalSort(fields);
    
    // Evaluate in order
    sorted.forEach(field => {
      this.evaluate(field, data);
    });
  }
  
  private topologicalSort(fields: ComputedField[]): ComputedField[] {
    const sorted: ComputedField[] = [];
    const visited = new Set<string>();
    const visiting = new Set<string>();
    
    const visit = (field: ComputedField) => {
      if (visited.has(field.path)) return;
      if (visiting.has(field.path)) {
        throw new Error(`Circular dependency detected: ${field.path}`);
      }
      
      visiting.add(field.path);
      
      // Visit dependencies first
      field.dependsOn.forEach(dep => {
        const depField = fields.find(f => f.path === dep);
        if (depField) visit(depField);
      });
      
      visiting.delete(field.path);
      visited.add(field.path);
      sorted.push(field);
    };
    
    fields.forEach(visit);
    return sorted;
  }
  
  registerCustomFunction(name: string, fn: Function): void {
    this.customFunctions[name] = fn;
  }
  
  clearCache(): void {
    this.computedValues.clear();
  }
}
```

### 8.4 Create Data Source Types
```typescript
// src/types/datasource.types.ts

export interface DataSource {
  type: 'http' | 'static' | 'function';
  url?: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  headers?: Record<string, string>;
  body?: any;
  params?: Record<string, any>;
  
  // Caching
  cache?: 'none' | 'swr' | 'persistent';
  ttlMs?: number;
  staleWhileRevalidate?: boolean;
  
  // Retry logic
  retries?: number;
  retryDelay?: number;
  
  // Transform
  transform?: string | ((data: any) => any);
  
  // Fallback
  fallback?: any;
  
  // Static data
  data?: any;
  
  // Function reference
  fn?: string;
}

export interface CachedData {
  data: any;
  timestamp: number;
  etag?: string;
}

export interface DataSourceResult {
  data: any;
  loading: boolean;
  error?: Error;
  isValidating: boolean;
  mutate: (data?: any) => Promise<void>;
}
```

### 8.5 Implement Data Source Manager
```typescript
// src/datasources/DataSourceManager.ts

import useSWR, { SWRConfiguration } from 'swr';

export class DataSourceManager {
  private cache = new Map<string, CachedData>();
  private fetchers = new Map<string, Function>();
  
  constructor() {
    this.registerDefaultFetchers();
  }
  
  private registerDefaultFetchers(): void {
    this.fetchers.set('http', this.httpFetcher.bind(this));
    this.fetchers.set('static', this.staticFetcher.bind(this));
    this.fetchers.set('function', this.functionFetcher.bind(this));
  }
  
  async fetch(source: DataSource, params?: any): Promise<any> {
    const cacheKey = this.getCacheKey(source, params);
    
    // Check cache first
    if (source.cache !== 'none') {
      const cached = this.getFromCache(cacheKey, source.ttlMs);
      if (cached) return cached;
    }
    
    // Fetch with retry
    const data = await this.fetchWithRetry(source, params);
    
    // Cache result
    if (source.cache !== 'none') {
      this.setCache(cacheKey, data);
    }
    
    return data;
  }
  
  private async fetchWithRetry(
    source: DataSource,
    params?: any,
    attempt: number = 0
  ): Promise<any> {
    const maxRetries = source.retries || 0;
    
    try {
      const fetcher = this.fetchers.get(source.type);
      if (!fetcher) {
        throw new Error(`Unknown data source type: ${source.type}`);
      }
      
      const data = await fetcher(source, params);
      
      // Apply transform
      if (source.transform) {
        if (typeof source.transform === 'string') {
          return JSONPath.value(data, source.transform);
        } else {
          return source.transform(data);
        }
      }
      
      return data;
    } catch (error) {
      if (attempt < maxRetries) {
        const delay = source.retryDelay || Math.pow(2, attempt) * 1000;
        await this.delay(delay);
        return this.fetchWithRetry(source, params, attempt + 1);
      }
      
      // Return fallback on final failure
      if (source.fallback !== undefined) {
        return source.fallback;
      }
      
      throw error;
    }
  }
  
  private async httpFetcher(source: DataSource, params?: any): Promise<any> {
    const url = this.interpolateUrl(source.url!, params);
    
    const response = await fetch(url, {
      method: source.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...source.headers
      },
      body: source.body ? JSON.stringify(source.body) : undefined
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    return response.json();
  }
  
  private async staticFetcher(source: DataSource): Promise<any> {
    return source.data;
  }
  
  private async functionFetcher(source: DataSource, params?: any): Promise<any> {
    const fn = this.fetchers.get(source.fn!);
    if (!fn) {
      throw new Error(`Function not found: ${source.fn}`);
    }
    return fn(params);
  }
  
  private interpolateUrl(url: string, params?: any): string {
    if (!params) return url;
    
    let interpolated = url;
    Object.entries(params).forEach(([key, value]) => {
      interpolated = interpolated.replace(`{${key}}`, String(value));
    });
    
    return interpolated;
  }
  
  private getCacheKey(source: DataSource, params?: any): string {
    const baseKey = source.url || source.type;
    return `${baseKey}_${JSON.stringify(params || {})}`;
  }
  
  private getFromCache(key: string, ttlMs?: number): any {
    const cached = this.cache.get(key);
    if (!cached) return null;
    
    if (ttlMs && Date.now() - cached.timestamp > ttlMs) {
      this.cache.delete(key);
      return null;
    }
    
    return cached.data;
  }
  
  private setCache(key: string, data: any): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }
  
  private isExpired(cached: CachedData, ttlMs?: number): boolean {
    if (!ttlMs) return false;
    return Date.now() - cached.timestamp > ttlMs;
  }
  
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  registerFetcher(name: string, fetcher: Function): void {
    this.fetchers.set(name, fetcher);
  }
  
  clearCache(): void {
    this.cache.clear();
  }
}
```

### 8.6 Create React Hook for Data Sources
```typescript
// src/hooks/useDataSource.ts

import useSWR, { SWRConfiguration } from 'swr';
import { DataSourceManager } from '@/datasources/DataSourceManager';

const manager = new DataSourceManager();

export function useDataSource(
  source: DataSource | undefined,
  params?: any,
  options?: SWRConfiguration
): DataSourceResult {
  const key = source ? `${source.type}_${JSON.stringify(params)}` : null;
  
  const config: SWRConfiguration = {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    ...options,
    ...(source?.cache === 'swr' ? {
      dedupingInterval: source.ttlMs,
      refreshInterval: source.ttlMs
    } : {})
  };
  
  const { data, error, isValidating, mutate } = useSWR(
    key,
    () => source ? manager.fetch(source, params) : null,
    config
  );
  
  return {
    data: data ?? source?.fallback,
    loading: !error && !data,
    error,
    isValidating,
    mutate
  };
}
```

### 8.7 Integrate with Form Renderer
```typescript
// src/hooks/useComputedFields.ts

import { useEffect, useRef, useCallback } from 'react';
import { ComputedFieldEngine } from '@/computed/ComputedFieldEngine';

export function useComputedFields(
  computedFields: ComputedField[],
  formData: any,
  onUpdate: (field: string, value: any) => void
) {
  const engineRef = useRef<ComputedFieldEngine>();
  
  useEffect(() => {
    engineRef.current = new ComputedFieldEngine();
    
    // Register all computed fields
    computedFields.forEach(field => {
      engineRef.current!.registerComputedField(field);
    });
    
    // Initial evaluation
    engineRef.current.evaluateAll(computedFields, formData);
  }, []);
  
  const handleFieldChange = useCallback((fieldPath: string) => {
    if (!engineRef.current) return;
    
    // Find affected computed fields
    const affected = engineRef.current.getAffectedFields(fieldPath);
    
    // Re-evaluate affected fields
    affected.forEach(path => {
      const field = computedFields.find(f => f.path === path);
      if (field) {
        const result = engineRef.current!.evaluate(field, formData);
        if (!result.error) {
          onUpdate(path, result.value);
        }
      }
    });
  }, [computedFields, formData, onUpdate]);
  
  return { handleFieldChange };
}
```

## Test Cases

### Computed Field Tests
```typescript
describe('ComputedFieldEngine', () => {
  let engine: ComputedFieldEngine;
  
  beforeEach(() => {
    engine = new ComputedFieldEngine();
  });
  
  it('should calculate simple arithmetic', () => {
    const field: ComputedField = {
      path: '$.total',
      expr: 'price * quantity',
      dependsOn: ['$.price', '$.quantity']
    };
    
    engine.registerComputedField(field);
    
    const data = { price: 10, quantity: 5 };
    const result = engine.evaluate(field, data);
    
    expect(result.value).toBe(50);
    expect(data.total).toBe(50);
  });
  
  it('should handle complex expressions', () => {
    const field: ComputedField = {
      path: '$.age',
      expr: 'floor((now() - dateOfBirth) / 31536000000)',
      dependsOn: ['$.dateOfBirth']
    };
    
    engine.registerComputedField(field);
    
    const data = { 
      dateOfBirth: new Date('1990-01-01').getTime() 
    };
    const result = engine.evaluate(field, data);
    
    expect(result.value).toBeGreaterThan(30);
  });
  
  it('should detect circular dependencies', () => {
    const fields: ComputedField[] = [
      {
        path: '$.a',
        expr: 'b + 1',
        dependsOn: ['$.b']
      },
      {
        path: '$.b',
        expr: 'a + 1',
        dependsOn: ['$.a']
      }
    ];
    
    fields.forEach(f => engine.registerComputedField(f));
    
    expect(() => {
      engine.evaluateAll(fields, {});
    }).toThrow('Circular dependency');
  });
  
  it('should use fallback on error', () => {
    const field: ComputedField = {
      path: '$.result',
      expr: 'undefinedVar + 1',
      dependsOn: [],
      fallback: 0
    };
    
    engine.registerComputedField(field);
    
    const data = {};
    const result = engine.evaluate(field, data);
    
    expect(result.value).toBe(0);
    expect(result.error).toBeDefined();
  });
});
```

### Data Source Tests
```typescript
describe('DataSourceManager', () => {
  let manager: DataSourceManager;
  
  beforeEach(() => {
    manager = new DataSourceManager();
    fetchMock.resetMocks();
  });
  
  it('should fetch HTTP data', async () => {
    fetchMock.mockResponseOnce(JSON.stringify({ data: 'test' }));
    
    const source: DataSource = {
      type: 'http',
      url: 'https://api.example.com/data',
      method: 'GET'
    };
    
    const result = await manager.fetch(source);
    expect(result).toEqual({ data: 'test' });
  });
  
  it('should cache results', async () => {
    fetchMock.mockResponseOnce(JSON.stringify({ data: 'test' }));
    
    const source: DataSource = {
      type: 'http',
      url: 'https://api.example.com/data',
      cache: 'swr',
      ttlMs: 60000
    };
    
    await manager.fetch(source);
    const cached = await manager.fetch(source);
    
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(cached).toEqual({ data: 'test' });
  });
  
  it('should retry on failure', async () => {
    fetchMock
      .mockRejectOnce(new Error('Network error'))
      .mockResponseOnce(JSON.stringify({ data: 'success' }));
    
    const source: DataSource = {
      type: 'http',
      url: 'https://api.example.com/data',
      retries: 1,
      retryDelay: 100
    };
    
    const result = await manager.fetch(source);
    
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(result).toEqual({ data: 'success' });
  });
  
  it('should use fallback on final failure', async () => {
    fetchMock.mockReject(new Error('Network error'));
    
    const source: DataSource = {
      type: 'http',
      url: 'https://api.example.com/data',
      retries: 2,
      fallback: { data: 'fallback' }
    };
    
    const result = await manager.fetch(source);
    
    expect(result).toEqual({ data: 'fallback' });
  });
});
```

## Success Criteria
- ✅ Computed fields evaluate correctly with dependencies
- ✅ Expression parser handles complex calculations
- ✅ Circular dependencies detected and prevented
- ✅ Data sources fetch and cache properly
- ✅ Retry logic works with exponential backoff
- ✅ Fallback values used on errors
- ✅ Performance: Computations <10ms for typical expressions
- ✅ Integration with form renderer complete

## Implementation Notes

### Performance Considerations
- Cache parsed expressions for reuse
- Batch compute field evaluations
- Use memoization for expensive calculations
- Debounce rapid field changes

### Error Handling
- Graceful fallback for invalid expressions
- Log computation errors for debugging
- Validate expressions at registration time
- Handle network failures in data sources

### Security Considerations
- Sanitize expressions to prevent code injection
- Validate data source URLs
- Implement request timeout limits
- Use CORS properly for external APIs

## Next Steps
With computed fields and data sources complete:
1. Implement performance monitoring (Step 9)
2. Add computed field debugging tools
3. Create data source mock utilities
4. Document expression syntax
5. Build data transformation helpers