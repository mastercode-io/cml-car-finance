import { Parser } from 'expr-eval';
import * as jsonpath from 'jsonpath';

import type { ComputedField, ComputedFieldResult } from '../types';

type Expression = ReturnType<Parser['parse']>;
type JsonPathCtor = new () => {
  value<T>(obj: Record<string, unknown>, path: string, newValue?: T): T;
};

const JsonPath = (jsonpath as unknown as { JSONPath: JsonPathCtor }).JSONPath;

export class ComputedFieldEngine {
  private readonly dependencies = new Map<string, Set<string>>();
  private readonly computedValues = new Map<string, unknown>();
  private readonly expressions = new Map<string, Expression>();
  private readonly customFunctions: Record<string, (...args: unknown[]) => unknown> = {};
  private readonly parser: Parser;
  private readonly jsonPath = new JsonPath();
  private userContext?: unknown;

  constructor(parser: Parser = new Parser()) {
    this.parser = parser;
    this.registerBuiltInFunctions();
  }

  registerComputedField(field: ComputedField): void {
    const targetPath = this.normalizePath(field.path);

    field.dependsOn.forEach((dep) => {
      const dependencyPath = this.normalizePath(dep);
      if (!this.dependencies.has(dependencyPath)) {
        this.dependencies.set(dependencyPath, new Set());
      }
      this.dependencies.get(dependencyPath)!.add(targetPath);
    });

    if (!this.expressions.has(targetPath)) {
      try {
        const expression = this.parser.parse(field.expr);
        this.expressions.set(targetPath, expression);
      } catch (error) {
        if (process.env.NODE_ENV !== 'test') {
          console.error(`Failed to parse expression for ${field.path}:`, error);
        }
      }
    }
  }

  evaluate(field: ComputedField, data: Record<string, unknown>): ComputedFieldResult {
    const targetPath = this.normalizePath(field.path);
    const dependencies = field.dependsOn.map((dep) => this.normalizePath(dep));
    const timestamp = Date.now();

    try {
      let expression = this.expressions.get(targetPath);
      if (!expression) {
        expression = this.parser.parse(field.expr);
        this.expressions.set(targetPath, expression);
      }

      const context = this.createContext(data, dependencies);
      const evaluated = expression.evaluate(context as Record<string, unknown>);
      const rounded = this.applyRounding(evaluated, field.round);

      if (field.cache !== false) {
        this.computedValues.set(targetPath, rounded);
      }

      this.setValueAtPath(data, targetPath, rounded);

      return {
        path: field.path,
        value: rounded,
        dependencies,
        timestamp,
      };
    } catch (error) {
      const fallbackValue = field.fallback ?? null;
      this.setValueAtPath(data, targetPath, fallbackValue);

      return {
        path: field.path,
        value: fallbackValue,
        error: error as Error,
        dependencies,
        timestamp,
      };
    }
  }

  evaluateAll(fields: ComputedField[], data: Record<string, unknown>): ComputedFieldResult[] {
    if (!fields.length) {
      return [];
    }

    const sorted = this.topologicalSort(fields);
    return sorted.map((field) => this.evaluate(field, data));
  }

  getComputedValue(path: string): unknown {
    return this.computedValues.get(this.normalizePath(path));
  }

  getAffectedFields(changedField: string): string[] {
    const normalized = this.normalizePath(changedField);
    const affected = new Set<string>();
    const queue: string[] = [normalized];

    while (queue.length) {
      const current = queue.pop();
      if (!current) continue;
      const dependents = this.dependencies.get(current);
      if (!dependents) continue;

      dependents.forEach((dep) => {
        if (!affected.has(dep)) {
          affected.add(dep);
          queue.push(dep);
        }
      });
    }

    return Array.from(affected.values());
  }

  registerCustomFunction(name: string, fn: (...args: unknown[]) => unknown): void {
    this.customFunctions[name] = fn;
  }

  setUserContext(user: unknown): void {
    this.userContext = user;
  }

  clearCache(): void {
    this.computedValues.clear();
  }

  private registerBuiltInFunctions(): void {
    const builtIns: Record<string, (...args: unknown[]) => unknown> = {
      now: () => Date.now(),
      today: () => new Date().toISOString().split('T')[0],
      year: (date: unknown) => new Date(date as Date).getFullYear(),
      month: (date: unknown) => new Date(date as Date).getMonth() + 1,
      day: (date: unknown) => new Date(date as Date).getDate(),
      floor: (value: unknown) => Math.floor(Number(value ?? 0)),
      ceil: (value: unknown) => Math.ceil(Number(value ?? 0)),
      round: (value: unknown) => Math.round(Number(value ?? 0)),
      abs: (value: unknown) => Math.abs(Number(value ?? 0)),
      concat: (...args: unknown[]) => args.join(''),
      upper: (value: unknown) => (typeof value === 'string' ? value.toUpperCase() : value),
      lower: (value: unknown) => (typeof value === 'string' ? value.toLowerCase() : value),
      trim: (value: unknown) => (typeof value === 'string' ? value.trim() : value),
      sum: (arr: unknown) =>
        Array.isArray(arr) ? arr.reduce<number>((acc, val) => acc + Number(val ?? 0), 0) : 0,
      avg: (arr: unknown) => {
        if (!Array.isArray(arr) || arr.length === 0) {
          return 0;
        }
        const total = arr.reduce<number>((acc, val) => acc + Number(val ?? 0), 0);
        return total / arr.length;
      },
      count: (arr: unknown) => (Array.isArray(arr) ? arr.length : 0),
    };

    Object.entries(builtIns).forEach(([key, fn]) => {
      this.customFunctions[key] = fn;
    });
  }

  private createContext(
    data: Record<string, unknown>,
    dependencies: string[],
  ): Record<string, unknown> {
    const context: Record<string, unknown> = {
      ...this.customFunctions,
      data,
      now: this.customFunctions.now ?? (() => Date.now()),
      today: this.customFunctions.today ?? (() => new Date().toISOString().split('T')[0]),
    };

    if (this.userContext !== undefined) {
      context.user = this.userContext;
    }

    Object.assign(context, data);

    dependencies.forEach((dep) => {
      const cleanPath = this.stripPrefix(dep);
      if (!cleanPath) {
        return;
      }

      const value = this.safeGetValue(data, dep);
      this.assignContextValue(context, cleanPath, value);
    });

    context.custom = this.customFunctions;

    return context;
  }

  private assignContextValue(context: Record<string, unknown>, path: string, value: unknown): void {
    const segments = this.parsePathSegments(path);
    if (!segments.length) {
      return;
    }

    let current: any = context;
    segments.forEach((segment, index) => {
      const isLast = index === segments.length - 1;
      if (isLast) {
        current[segment] = value;
        return;
      }

      if (current[segment] === undefined) {
        current[segment] = typeof segments[index + 1] === 'number' ? [] : {};
      }

      current = current[segment];
    });
  }

  private parsePathSegments(path: string): Array<string | number> {
    const cleaned = path.replace(/\['([^']+)'\]/g, '.$1');
    const tokens = cleaned.match(/[^.\[\]]+/g);
    if (!tokens) {
      return [];
    }

    return tokens.map((token) => {
      const numeric = Number(token);
      return Number.isInteger(numeric) && token === numeric.toString() ? numeric : token;
    });
  }

  private safeGetValue(data: Record<string, unknown>, path: string): unknown {
    try {
      return this.jsonPath.value(data, path);
    } catch (error) {
      if (process.env.NODE_ENV !== 'test') {
        console.warn(`Failed to resolve JSONPath ${path}`, error);
      }
      return undefined;
    }
  }

  private setValueAtPath(data: Record<string, unknown>, path: string, value: unknown): void {
    try {
      this.jsonPath.value(data as Record<string, unknown>, path, value);
    } catch (error) {
      if (process.env.NODE_ENV !== 'test') {
        console.warn(`Failed to set value at path ${path}`, error);
      }
      const cleanPath = this.stripPrefix(path);
      if (!cleanPath) return;
      this.assignContextValue(data as Record<string, unknown>, cleanPath, value);
    }
  }

  private topologicalSort(fields: ComputedField[]): ComputedField[] {
    const visited = new Set<string>();
    const visiting = new Set<string>();
    const sorted: ComputedField[] = [];
    const fieldMap = new Map<string, ComputedField>();

    fields.forEach((field) => {
      fieldMap.set(this.normalizePath(field.path), field);
    });

    const visit = (field: ComputedField): void => {
      const fieldPath = this.normalizePath(field.path);
      if (visited.has(fieldPath)) {
        return;
      }
      if (visiting.has(fieldPath)) {
        throw new Error(`Circular dependency detected: ${field.path}`);
      }

      visiting.add(fieldPath);

      field.dependsOn.forEach((dep) => {
        const dependencyField = fieldMap.get(this.normalizePath(dep));
        if (dependencyField) {
          visit(dependencyField);
        }
      });

      visiting.delete(fieldPath);
      visited.add(fieldPath);
      sorted.push(field);
    };

    fields.forEach(visit);
    return sorted;
  }

  private normalizePath(path: string): string {
    if (!path) {
      return path;
    }
    if (path.startsWith('$.') || path.startsWith('$[')) {
      return path;
    }
    if (path === '$') {
      return '$';
    }
    return `$.${path}`;
  }

  private stripPrefix(path: string): string {
    return path.startsWith('$.')
      ? path.substring(2)
      : path.replace(/^\$\['?/, '').replace(/'?]$/, '');
  }

  private applyRounding(value: unknown, decimals?: number): unknown {
    if (typeof value !== 'number' || decimals === undefined) {
      return value;
    }

    const factor = Math.pow(10, decimals);
    return Math.round(value * factor) / factor;
  }
}
