import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import ajvErrors from 'ajv-errors';
import addKeywords from 'ajv-keywords';
import { evaluateRule } from '../rules/rule-evaluator';
const now = () => (typeof performance !== 'undefined' ? performance.now() : Date.now());
export class ValidationEngine {
    ajv;
    compiledSchemas = new Map();
    performanceMetrics = new Map();
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
    registerCustomFormats() {
        const postcodeValidator = (data) => {
            if (typeof data !== 'string')
                return false;
            const trimmed = data.trim().toUpperCase();
            if (!trimmed)
                return false;
            if (trimmed === 'GIR 0AA' || trimmed === 'GIR0AA') {
                return true;
            }
            return /^[A-Z]{1,2}[0-9][A-Z0-9]?\s?[0-9][A-Z]{2}$/.test(trimmed);
        };
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
            validate: (data) => /^\d{5}(-\d{4})?$/.test(data),
        });
        this.ajv.addFormat('phone', {
            type: 'string',
            validate: (data) => /^\+[1-9]\d{1,14}$/.test(data),
        });
        this.ajv.addFormat('iban', {
            type: 'string',
            validate: (data) => {
                const iban = data.replace(/\s/g, '').toUpperCase();
                if (!/^[A-Z]{2}[0-9]{2}[A-Z0-9]+$/.test(iban))
                    return false;
                const rearranged = iban.slice(4) + iban.slice(0, 4);
                const numeric = rearranged.replace(/[A-Z]/g, (char) => String(char.charCodeAt(0) - 55));
                try {
                    return BigInt(numeric) % 97n === 1n;
                }
                catch (error) {
                    console.warn('IBAN validation failed', error);
                    return false;
                }
            },
        });
        this.ajv.addFormat('currency', {
            type: 'number',
            validate: (data) => Number.isFinite(data) && data >= 0,
        });
        this.ajv.addFormat('credit-card', {
            type: 'string',
            validate: (data) => {
                const cleaned = data.replace(/\D/g, '');
                if (cleaned.length < 13 || cleaned.length > 19)
                    return false;
                let sum = 0;
                let isEven = false;
                for (let index = cleaned.length - 1; index >= 0; index--) {
                    let digit = parseInt(cleaned[index], 10);
                    if (isEven) {
                        digit *= 2;
                        if (digit > 9)
                            digit -= 9;
                    }
                    sum += digit;
                    isEven = !isEven;
                }
                return sum % 10 === 0;
            },
        });
    }
    registerCustomKeywords() {
        this.ajv.addKeyword({
            keyword: 'requiredWhen',
            type: 'object',
            schemaType: 'object',
            errors: true,
            compile: (schema) => {
                const validator = (data) => {
                    if (!schema || typeof schema !== 'object')
                        return true;
                    const { condition, fields } = schema;
                    if (!condition || !fields?.length)
                        return true;
                    if (!evaluateRule(condition, data)) {
                        return true;
                    }
                    for (const field of fields) {
                        if (data[field] === undefined || data[field] === null || data[field] === '') {
                            validator.errors = [
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
            compile: (schema) => (data) => {
                if (!schema || typeof schema !== 'object')
                    return true;
                const { field1, field2, operator } = schema;
                if (!field1 || !field2)
                    return true;
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
        const asyncValidator = (async (schema, data) => {
            if (!schema || typeof schema !== 'object')
                return true;
            const { endpoint, method = 'POST', timeout = 2000, } = schema;
            if (!endpoint)
                return true;
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
                    asyncValidator.errors = [
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
                    asyncValidator.errors = [
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
            }
            catch (error) {
                console.error('Async validation error', error);
                return true;
            }
        });
        this.ajv.addKeyword({
            keyword: 'asyncValidate',
            async: true,
            type: 'string',
            schemaType: 'object',
            errors: true,
            validate: asyncValidator,
        });
    }
    compile(schema) {
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
    async validate(schema, data, options) {
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
        }
        catch (error) {
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
    getPerformanceMetrics(schemaId) {
        const metrics = this.performanceMetrics.get(schemaId) ?? [];
        if (!metrics.length) {
            return { p50: 0, p95: 0, p99: 0, avg: 0 };
        }
        const sorted = [...metrics].sort((a, b) => a - b);
        const percentile = (p) => sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * p))];
        return {
            p50: percentile(0.5),
            p95: percentile(0.95),
            p99: percentile(0.99),
            avg: metrics.reduce((acc, value) => acc + value, 0) / metrics.length,
        };
    }
    trackPerformance(schemaId, duration) {
        const metrics = this.performanceMetrics.get(schemaId) ?? [];
        metrics.push(duration);
        if (metrics.length > 100) {
            metrics.shift();
        }
        this.performanceMetrics.set(schemaId, metrics);
    }
    formatErrors(errors) {
        return errors.map((error) => ({
            path: error.instancePath,
            property: typeof error.params === 'object' && error.params && 'missingProperty' in error.params
                ? String(error.params.missingProperty)
                : undefined,
            message: this.getErrorMessage(error),
            keyword: error.keyword,
            params: error.params,
        }));
    }
    getErrorMessage(error) {
        const customMessages = {
            required: (e) => `${e.params.missingProperty} is required`,
            minLength: (e) => `Must be at least ${e.params.limit} characters`,
            maxLength: (e) => `Must be at most ${e.params.limit} characters`,
            minimum: (e) => `Must be at least ${e.params.limit}`,
            maximum: (e) => `Must be at most ${e.params.limit}`,
            pattern: () => 'Invalid format',
            format: (e) => `Invalid ${e.params.format} format`,
            enum: (e) => `Must be one of: ${e.params.allowedValues.join(', ')}`,
            type: (e) => `Must be a ${e.params.type}`,
        };
        const generator = customMessages[error.keyword];
        return generator ? generator(error) : error.message || 'Validation failed';
    }
}
//# sourceMappingURL=ajv-setup.js.map