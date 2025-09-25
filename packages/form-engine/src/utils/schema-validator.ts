import Ajv from 'ajv';
import addFormats from 'ajv-formats';

import type { CompiledSchema, JSONSchema, UnifiedFormSchema, ValidationResult } from '../types';
import { lintNavigationSchema } from './navigation-linter';

const UNIFIED_SCHEMA_META: JSONSchema = {
  $id: 'https://schemas.cml.local/unified-form-schema.json',
  type: 'object',
  required: ['$id', 'version', 'metadata', 'steps', 'transitions', 'ui'],
  properties: {
    $id: { type: 'string' },
    version: { type: 'string' },
    extends: {
      type: 'array',
      items: { type: 'string' },
    },
    metadata: {
      type: 'object',
      required: ['title', 'sensitivity'],
      properties: {
        title: { type: 'string' },
        description: { type: 'string' },
        sensitivity: {
          type: 'string',
          enum: ['low', 'medium', 'high'],
        },
        retainHidden: { type: 'boolean' },
        allowAutosave: { type: 'boolean' },
        timeout: { type: 'number' },
        tags: {
          type: 'array',
          items: { type: 'string' },
        },
        owner: { type: 'string' },
        lastModified: { type: 'string' },
      },
    },
    definitions: {
      type: 'object',
    },
    steps: {
      type: 'array',
      minItems: 1,
      items: {
        type: 'object',
        required: ['id', 'title', 'schema'],
        properties: {
          id: { type: 'string' },
          title: { type: 'string' },
          description: { type: 'string' },
          visibleWhen: { type: 'object' },
          helpText: { type: 'string' },
          schema: {
            anyOf: [
              { type: 'object' },
              {
                type: 'object',
                required: ['$ref'],
                properties: {
                  $ref: { type: 'string' },
                },
              },
            ],
          },
        },
      },
    },
    transitions: {
      type: 'array',
      items: {
        type: 'object',
        required: ['from', 'to'],
        properties: {
          from: { type: 'string' },
          to: { type: 'string' },
          when: { type: 'object' },
          default: { type: 'boolean' },
          allowCycle: { type: 'boolean' },
        },
      },
    },
    ui: { type: 'object' },
    computed: {
      type: 'array',
      items: {
        type: 'object',
        required: ['path', 'expr', 'dependsOn'],
        properties: {
          path: { type: 'string' },
          expr: { type: 'string' },
          dependsOn: {
            type: 'array',
            minItems: 1,
            items: { type: 'string' },
          },
        },
      },
    },
    dataSources: {
      type: 'object',
    },
    navigation: {
      type: 'object',
      properties: {
        review: {
          type: 'object',
          properties: {
            stepId: { type: 'string' },
            terminal: { type: 'boolean' },
            validate: { type: 'string', enum: ['form', 'step'] },
            freezeNavigation: { type: 'boolean' },
          },
        },
        jumpToFirstInvalidOn: {
          type: 'string',
          enum: ['submit', 'next', 'never'],
        },
      },
      additionalProperties: true,
    },
  },
  additionalProperties: true,
};

export class SchemaValidator {
  private ajv: any;

  constructor() {
    this.ajv = new Ajv({
      allErrors: true,
      verbose: true,
      strict: true,
      validateFormats: true,
    });

    addFormats(this.ajv);
    this.registerCustomFormats();
    this.registerCustomKeywords();
    this.ajv.addSchema(UNIFIED_SCHEMA_META, UNIFIED_SCHEMA_META.$id!);
  }

  private registerCustomFormats(): void {
    this.ajv.addFormat('phone', {
      type: 'string',
      validate: (data: string) => /^\+?[1-9]\d{1,14}$/.test(data),
    });

    const postcodeValidator = (data: string) =>
      /^[A-Z]{1,2}[0-9]{1,2}[A-Z]?\s?[0-9][A-Z]{2}$/i.test(data.trim());

    this.ajv.addFormat('gb-postcode', {
      type: 'string',
      validate: postcodeValidator,
    });

    this.ajv.addFormat('postcode', {
      type: 'string',
      validate: postcodeValidator,
    });

    this.ajv.addFormat('iban', {
      type: 'string',
      validate: (data: string) =>
        /^[A-Z]{2}[0-9]{2}[A-Z0-9]{4}[0-9]{7}([A-Z0-9]?){0,16}$/.test(data),
    });

    this.ajv.addFormat('currency', {
      type: 'string',
      validate: (data: string) => /^\d+(\.\d{1,2})?$/.test(data),
    });
  }

  private registerCustomKeywords(): void {
    this.ajv.addKeyword({
      keyword: 'requiredWhen',
      type: 'object',
      schemaType: 'object',
      errors: true,
      compile(schema: any) {
        const validator = (data: Record<string, unknown>) => {
          if (!schema || typeof schema !== 'object') return true;
          const { field, equals } = schema as {
            field?: string;
            equals?: unknown;
          };
          if (!field) return true;
          if (data[field] === equals) {
            const required: string[] = Array.isArray(schema.requires) ? schema.requires : [];
            for (const requiredField of required) {
              if (
                data[requiredField] === undefined ||
                data[requiredField] === null ||
                data[requiredField] === ''
              ) {
                (validator as any).errors = [
                  {
                    instancePath: `/${requiredField}`,
                    schemaPath: '#/requiredWhen',
                    keyword: 'requiredWhen',
                    params: { missingProperty: requiredField },
                    message: `${requiredField} is required`,
                  },
                ];
                return false;
              }
            }
          }
          return true;
        };

        return validator;
      },
    });
  }

  validateSchema(schema: UnifiedFormSchema): ValidationResult {
    const ajvValid = this.ajv.validate(UNIFIED_SCHEMA_META.$id!, schema);
    const ajvErrors = (this.ajv.errors || []).map((error: any) => ({
      path: error.instancePath,
      message: error.message || 'Schema validation error',
      keyword: error.keyword,
      property:
        error.params && 'missingProperty' in error.params
          ? String(error.params.missingProperty)
          : undefined,
      params: error.params as Record<string, unknown>,
    }));

    const { errors: lintErrors, warnings } = lintNavigationSchema(schema);
    const errors = [...ajvErrors, ...lintErrors];

    return {
      valid: Boolean(ajvValid) && lintErrors.length === 0,
      errors,
      warnings,
    };
  }

  compileSchema(schema: JSONSchema): CompiledSchema {
    return this.ajv.compile(schema) as CompiledSchema;
  }
}
