import { StepValidator } from '@form-engine/index';
import type { JSONSchema } from '@form-engine/index';

describe('StepValidator', () => {
  it('validates individual steps and returns warnings', async () => {
    const validator = new StepValidator();
    const schema: JSONSchema = {
      type: 'object',
      properties: {
        firstName: { type: 'string', minLength: 1 },
        lastName: { type: 'string', minLength: 1 },
      },
      required: ['firstName', 'lastName'],
    };

    validator.registerStep('personal', schema);

    const result = await validator.validateStep('personal', { firstName: 'John' });

    expect(result.valid).toBe(false);
    expect(result.canProceed).toBe(true);
    expect(result.errors).toEqual(
      expect.arrayContaining([expect.objectContaining({ property: 'lastName' })]),
    );
  });

  it('blocks progression when configured', async () => {
    const validator = new StepValidator();
    const schema: JSONSchema = {
      type: 'object',
      properties: {
        required: { type: 'string' },
      },
      required: ['required'],
    };

    validator.registerStep('step1', schema);

    const result = await validator.validateStep('step1', {}, { blockOnError: true });

    expect(result.valid).toBe(false);
    expect(result.canProceed).toBe(false);
  });

  it('validates all registered steps', async () => {
    const validator = new StepValidator();
    const stepA: JSONSchema = {
      type: 'object',
      properties: {
        email: { type: 'string', format: 'email' },
      },
      required: ['email'],
    };
    const stepB: JSONSchema = {
      type: 'object',
      properties: {
        consent: { type: 'boolean' },
      },
      required: ['consent'],
    };

    validator.registerStep('contact', stepA);
    validator.registerStep('consent', stepB);

    const results = await validator.validateAllSteps(
      { email: 'invalid', consent: true },
      { fullData: true },
    );

    expect(results.get('contact')?.valid).toBe(false);
    expect(results.get('consent')?.valid).toBe(true);
  });
});
