import { ReactFormMigrator } from '../../../src/migration/ReactFormMigrator';

describe('ReactFormMigrator', () => {
  it('extracts fields from JSX and builds a schema', async () => {
    const component = `
      import React from 'react';

      export const SampleForm = () => (
        <form>
          <input name="fullName" required placeholder="Full name" />
          <input name="age" type="number" />
          <input name="email" type="email" />
        </form>
      );
    `;

    const migrator = new ReactFormMigrator();
    const result = await migrator.migrateComponent(component);

    expect(result.success).toBe(true);
    expect(result.errors).toHaveLength(0);
    expect(result.schema?.steps).toHaveLength(1);

    const step = result.schema?.steps[0];
    expect(step?.id).toBe('step-1');

    const properties = (step?.schema as any).properties;
    expect(Object.keys(properties)).toEqual(expect.arrayContaining(['fullName', 'age', 'email']));

    const required = (step?.schema as any).required ?? [];
    expect(required).toContain('fullName');
    expect(required).not.toContain('age');
  });
});
