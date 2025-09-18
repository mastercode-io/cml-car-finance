import { z } from 'zod';

import { ZodMigrator } from '../../../src/migration/ZodMigrator';

describe('ZodMigrator', () => {
  it('migrates simple Zod object into a unified schema', async () => {
    const schema = z.object({
      name: z.string().min(1),
      age: z.number().min(18),
      email: z.string().email().optional(),
    });

    const migrator = new ZodMigrator();
    const result = await migrator.migrate(schema, {
      validateOutput: true,
      generateTests: true,
    });

    expect(result.success).toBe(true);
    expect(result.errors).toHaveLength(0);
    expect(result.schema?.steps).toHaveLength(1);
    expect(result.generatedTests).toContain('Migrated Form');

    const step = result.schema?.steps[0];
    const stepSchema = step?.schema as any;
    expect(stepSchema.required).toContain('name');
    expect(stepSchema.required).toContain('age');
    expect(stepSchema.required).not.toContain('email');

    expect(result.stats.fieldsConverted).toBe(3);
    expect(result.stats.validationsConverted).toBeGreaterThan(0);
  });

  it('collects warnings for unsupported types', async () => {
    const schema = z.object({
      payload: z.instanceof(Date),
    });

    const migrator = new ZodMigrator();
    const result = await migrator.migrate(schema);

    expect(result.success).toBe(true);
    expect(result.warnings.length).toBeGreaterThan(0);
  });
});
