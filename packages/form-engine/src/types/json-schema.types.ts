import type { Rule } from './rules.types';

export type JSONSchemaType =
  | 'object'
  | 'array'
  | 'string'
  | 'number'
  | 'integer'
  | 'boolean'
  | 'null';

/**
 * Minimal JSON schema definition used by the form engine. The structure extends the
 * 2020-12 specification with a handful of custom keywords used throughout the
 * builder (visibility rules, computed values and remote data sources).
 */
export interface JSONSchema {
  $id?: string;
  $ref?: string;
  $async?: boolean;
  type?: JSONSchemaType | JSONSchemaType[];
  title?: string;
  description?: string;
  default?: unknown;
  const?: unknown;
  enum?: unknown[];
  examples?: unknown[];

  properties?: Record<string, JSONSchema>;
  required?: string[];
  patternProperties?: Record<string, JSONSchema>;
  additionalProperties?: boolean | JSONSchema;
  minProperties?: number;
  maxProperties?: number;
  dependentSchemas?: Record<string, JSONSchema>;
  dependentRequired?: Record<string, string[]>;

  items?: JSONSchema | JSONSchema[];
  contains?: JSONSchema;
  additionalItems?: boolean | JSONSchema;
  minItems?: number;
  maxItems?: number;
  uniqueItems?: boolean;

  minLength?: number;
  maxLength?: number;
  pattern?: string;
  format?: string;

  minimum?: number;
  maximum?: number;
  exclusiveMinimum?: number;
  exclusiveMaximum?: number;
  multipleOf?: number;

  allOf?: JSONSchema[];
  anyOf?: JSONSchema[];
  oneOf?: JSONSchema[];
  not?: JSONSchema;
  if?: JSONSchema;
  then?: JSONSchema;
  else?: JSONSchema;

  definitions?: Record<string, JSONSchema>;
  $defs?: Record<string, JSONSchema>;

  /**
   * Custom extensions that drive the dynamic behaviour of the engine. Each of the
   * fields is optional so the interface can be used with regular JSON schemas.
   */
  'x-visibility'?: Rule;
  'x-compute'?: string;
  'x-datasource'?: string;
  'x-step'?: string;
}

export interface ValidationError {
  path: string;
  message: string;
  keyword?: string;
  property?: string;
  params?: Record<string, unknown>;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  duration?: number;
}

export type CompiledSchema = (data: unknown) => boolean | Promise<boolean>;

export interface ValidationOptions {
  timeout?: number;
}

export interface StepValidationOptions extends ValidationOptions {
  fullData?: boolean;
  blockOnError?: boolean;
  useWorker?: boolean;
}

export interface StepValidationResult extends ValidationResult {
  stepId: string;
  canProceed: boolean;
  warnings: ValidationError[];
}
