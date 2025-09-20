import type { JSONSchema, ValidationOptions, ValidationResult } from '../../src/types';
import { ValidationEngine } from '../../src/validation/ajv-setup';

export class ValidationWorkerClient {
  private engine = new ValidationEngine();

  async validate(
    schema: JSONSchema,
    data: unknown,
    options?: ValidationOptions,
  ): Promise<ValidationResult> {
    return this.engine.validate(schema, data, options);
  }

  async compile(schema: JSONSchema): Promise<void> {
    await this.engine.compile(schema);
  }

  terminate(): void {
    // no-op for tests
  }
}
