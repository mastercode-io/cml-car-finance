import type { FieldErrors, Resolver } from 'react-hook-form';

import type { JSONSchema } from '../types';
import { ValidationEngine } from './ajv-setup';

function setNestedValue(target: FieldErrors, path: string, value: unknown) {
  const segments = path.split('.');
  let current: any = target;
  while (segments.length > 1) {
    const segment = segments.shift()!;
    current[segment] = current[segment] ?? {};
    current = current[segment];
  }
  current[segments[0]!] = value;
}

export function createAjvResolver(schema: JSONSchema, validationEngine?: ValidationEngine): Resolver {
  const engine = validationEngine ?? new ValidationEngine();
  return async values => {
    const result = await engine.validate(schema, values, { timeout: 50 });
    if (result.valid) {
      return {
        values,
        errors: {}
      };
    }

    const errors: FieldErrors = {};
    for (const error of result.errors) {
      const path = error.path.replace(/^\//, '').replace(/\//g, '.');
      const targetPath = path || error.property || '';
      if (!targetPath) continue;
      setNestedValue(errors, targetPath, {
        type: error.keyword,
        message: error.message
      });
    }

    return {
      values: {},
      errors
    };
  };
}
