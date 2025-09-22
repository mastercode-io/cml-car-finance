import Ajv, { type ErrorObject, type ValidateFunction } from 'ajv';
import addFormats from 'ajv-formats';
import ajvErrors from 'ajv-errors';
import addKeywords from 'ajv-keywords';

import type { JSONSchema, ValidationError, ValidationOptions, ValidationResult } from '../types';
import { evaluateRule } from '../rules/rule-evaluator';

export interface PerformanceMetrics {
  p50: number;
  p95: number;
  p99: number;
  avg: number;
}

const now = () => (typeof performance !== 'undefined' ? performance.now() : Date.now());

export class ValidationEngine {
  private ajv: any;
  private compiledSchemas: Map<string, ValidateFunction> = new Map();
  private performanceMetrics: Map<string, number[]> = new Map();

  constructor() {
    this.ajv = new Ajv({
      allErrors: true,
      verbose: true,
      strict: true,
      validateFormats: true,
      coerceTypes: true,
      useDefaults: true,
      removeAdditional: 'failing',
      $data: true,
      messages: true,
    });

    addFormats(this.ajv);
    addKeywords(this.ajv, [
      'typeof',
      'instanceof',
      'range',
      'exclusiveRange',
      'uniqueItemProperties',
      'regexp',
      'dynamicDefaults',
      'transform',
    ]);
    ajvErrors(this.ajv);
    this.registerCustomFormats();
    this.registerCustomKeywords();
  }

  private registerCustomFormats(): void {
    const postcodeValidator = (data: string) =>
      /^[A-Z]{1,2}[0-9][A-Z0-9]?\s?[0-9][A-Z]{2}$/i.test(data.trim());

    this.ajv.addFormat('gb-postcode', {
      type: 'string',
      validate: postcodeValidator,
    });

    this.ajv.addFormat('uk-postcode', {
      type: 'string',
      validate: postcodeValidator,
    });

    this.ajv.addFormat('us-zip', {
      type: 'string',
      validate: (data: string) => /^\d{5}(-\d{4})?$/.test(data),
    });

    this.ajv.addFormat('phone', {
      type: 'string',
      validate: (data: string) => /^\+[1-9]\d{1,14}$/.test(data),
    });

    this.ajv.addFormat('iban', {
      type: 'string',
      validate: (data: string) => {
        const iban = data.replace(/\s/g, '').toUpperCase();
        if (!/^[A-Z]{2}[0-9]{2}[A-Z0-9]+$/.test(iban)) return false;
        const rearranged = iban.slice(4) + iban.slice(0, 4);
        const numeric = rearranged.replace(/[A-Z]/g, (char) => String(char.charCodeAt(0) - 55));
        try {
          return BigInt(numeric) % 97n === 1n;
        } catch (error) {
          console.warn('IBAN validation failed', error);
          return false;
        }
      },
    });

    this.ajv.addFormat('currency', {
      type: 'number',
      validate: (data: number) => Number.isFinite(data) && data >= 0,
    });

    this.ajv.addFormat('credit-card', {
      type: 'string',
      validate: (data: string) => {
        const cleaned = data.replace(/\D/g, '');
        if (cleaned.length < 13 || cleaned.length > 19) return false;
        let sum = 0;
        let isEven = false;

        for (let index = cleaned.length - 1; index >= 0; index--) {
          let digit = parseInt(cleaned[index], 10);
          if (isEven) {
            digit *= 2;
            if (digit > 9) digit -= 9;
          }
          sum += digit;
          isEven = !isEven;
        }

        return sum % 10 === 0;
      },
    });
  }

  private registerCustomKeywords(): void {
    this.ajv.addKeyword({
      keyword: 'requiredWhen',
      type: 'object',
      schemaType: 'object',
      errors: true,
      compile: (schema: unknown) => {
        const validator = (data: Record<string, unknown>) => {
          if (!schema || typeof schema !== 'object') return true;
          const { condition, fields } = schema as { condition?: unknown; fields?: string[] };
          if (!condition || !fields?.length) return true;
          if (!evaluateRule(condition as any, data)) {
            return true;
          }

          for (const field of fields) {
            if (data[field] === undefined || data[field] === null || data[field] === '') {
              (validator as any).errors = [
                {
                  instancePath: `/${field}`,
                  schemaPath: '#/requiredWhen',
                  keyword: 'requiredWhen',
                  params: { missingProperty: field },
                  message: `${field} is required`,
                },
              ];
              return false;
            }
          }
          return true;
        };
        return validator;
      },
    });

    this.ajv.addKeyword({
      keyword: 'crossField',
      type: 'object',
      schemaType: 'object',
      errors: false,
      compile: (schema: unknown) => (data: Record<string, unknown>) => {
        if (!schema || typeof schema !== 'object') return true;
        const { field1, field2, operator } = schema as {
          field1?: string;
          field2?: string;
          operator?: 'equals' | 'notEquals' | 'greaterThan' | 'lessThan';
        };
        if (!field1 || !field2) return true;
        const left = data[field1];
        const right = data[field2];
        switch (operator) {
          case 'equals':
            return left === right;
          case 'notEquals':
            return left !== right;
          case 'greaterThan':
            return Number(left) > Number(right);
          case 'lessThan':
            return Number(left) < Number(right);
          default:
            return true;
        }
      },
    });

    const asyncValidator = (async (schema: unknown, data: unknown) => {
      if (!schema || typeof schema !== 'object') return true;
      const {
        endpoint,
        method = 'POST',
        timeout = 2000,
      } = schema as {
        endpoint?: string;
        method?: string;
        timeout?: number;
      };
      if (!endpoint) return true;

      try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), timeout);
        const response = await fetch(endpoint, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ value: data }),
          signal: controller.signal,
        });
        clearTimeout(timer);

        if (!response.ok) {
          (asyncValidator as any).errors = [
            {
              instancePath: '',
              schemaPath: '#/asyncValidate',
              keyword: 'asyncValidate',
              message: `Async validation failed with status ${response.status}`,
            },
          ];
          return false;
        }

        const result = await response.json();
        if (result?.valid === false) {
          (asyncValidator as any).errors = [
            {
              instancePath: '',
              schemaPath: '#/asyncValidate',
              keyword: 'asyncValidate',
              message: result.message || 'Async validation failed',
            },
          ];
          return false;
        }
        return true;
      } catch (error) {
        console.error('Async validation error', error);
        return true;
      }
    }) as any;

    this.ajv.addKeyword({
      keyword: 'asyncValidate',
      async: true,
      type: 'string',
      schemaType: 'object',
      errors: true,
      validate: asyncValidator,
    });
  }

  compile(schema: JSONSchema): ValidateFunction {
    const schemaId = schema.$id || JSON.stringify(schema);
    const existing = this.compiledSchemas.get(schemaId);
    if (existing) {
      return existing;
    }
    const needsAsync = JSON.stringify(schema).includes('"asyncValidate"');
    const targetSchema = needsAsync && !schema.$async ? { ...schema, $async: true } : schema;
    const compiled = this.ajv.compile(targetSchema);
    this.compiledSchemas.set(schemaId, compiled);
    return compiled;
  }

  async validate(
    schema: JSONSchema,
    data: unknown,
    options?: ValidationOptions,
  ): Promise<ValidationResult> {
    const start = now();
    try {
      const validate = this.compile(schema);
      const valid = await validate(data);
      const duration = now() - start;
      this.trackPerformance(schema.$id || 'anonymous', duration);
      if (options?.timeout && duration > options.timeout) {
        console.warn(`Validation exceeded timeout: ${duration}ms`);
      }
      return {
        valid: Boolean(valid),
        errors: validate.errors ? this.formatErrors(validate.errors) : [],
        duration,
      };
    } catch (error) {
      return {
        valid: false,
        errors: [
          {
            path: '',
            message: error instanceof Error ? error.message : 'Validation failed',
          },
        ],
        duration: now() - start,
      };
    }
  }

  getPerformanceMetrics(schemaId: string): PerformanceMetrics {
    const metrics = this.performanceMetrics.get(schemaId) ?? [];
    if (!metrics.length) {
      return { p50: 0, p95: 0, p99: 0, avg: 0 };
    }
    const sorted = [...metrics].sort((a, b) => a - b);
    const percentile = (p: number) =>
      sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * p))];
    return {
      p50: percentile(0.5),
      p95: percentile(0.95),
      p99: percentile(0.99),
      avg: metrics.reduce((acc, value) => acc + value, 0) / metrics.length,
    };
  }

  private trackPerformance(schemaId: string, duration: number): void {
    const metrics = this.performanceMetrics.get(schemaId) ?? [];
    metrics.push(duration);
    if (metrics.length > 100) {
      metrics.shift();
    }
    this.performanceMetrics.set(schemaId, metrics);
  }

  private formatErrors(errors: ErrorObject[]): ValidationError[] {
    return errors.map((error) => ({
      path: error.instancePath,
      property:
        typeof error.params === 'object' && error.params && 'missingProperty' in error.params
          ? String((error.params as any).missingProperty)
          : undefined,
      message: this.getErrorMessage(error),
      keyword: error.keyword,
      params: error.params as Record<string, unknown>,
    }));
  }

  private getErrorMessage(error: ErrorObject): string {
    const customMessages: Record<string, (error: ErrorObject) => string> = {
      required: (e) => `${(e.params as any).missingProperty} is required`,
      minLength: (e) => `Must be at least ${(e.params as any).limit} characters`,
      maxLength: (e) => `Must be at most ${(e.params as any).limit} characters`,
      minimum: (e) => `Must be at least ${(e.params as any).limit}`,
      maximum: (e) => `Must be at most ${(e.params as any).limit}`,
      pattern: () => 'Invalid format',
      format: (e) => `Invalid ${(e.params as any).format} format`,
      enum: (e) => `Must be one of: ${(e.params as any).allowedValues.join(', ')}`,
      type: (e) => `Must be a ${(e.params as any).type}`,
    };
    const generator = customMessages[error.keyword];
    return generator ? generator(error) : error.message || 'Validation failed';
  }
}
