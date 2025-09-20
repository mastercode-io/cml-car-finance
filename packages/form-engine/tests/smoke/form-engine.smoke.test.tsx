import * as React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import * as FormEngine from '@form-engine/index';
import type { UnifiedFormSchema } from '@form-engine/index';

describe('form-engine smoke suite', () => {
  it('exposes the primary public API surface', () => {
    const {
      FormRenderer,
      FieldRegistry,
      initializeFieldRegistry,
      ValidationEngine,
      SchemaValidator,
      PersistenceManager,
      DataSourceManager,
      ComputedFieldEngine,
      RuleEvaluator,
      TransitionEngine,
      VisibilityController,
      XStateAdapter,
      useFormAnalytics,
      useStepValidation,
      useComputedFields,
      useDataSource,
    } = FormEngine;

    expect(FormRenderer).toBeDefined();
    expect(FieldRegistry).toBeDefined();
    expect(initializeFieldRegistry).toBeInstanceOf(Function);
    expect(ValidationEngine).toBeDefined();
    expect(SchemaValidator).toBeDefined();
    expect(PersistenceManager).toBeDefined();
    expect(DataSourceManager).toBeDefined();
    expect(ComputedFieldEngine).toBeDefined();
    expect(RuleEvaluator).toBeDefined();
    expect(TransitionEngine).toBeDefined();
    expect(VisibilityController).toBeDefined();
    expect(XStateAdapter).toBeDefined();
    expect(useFormAnalytics).toBeInstanceOf(Function);
    expect(useStepValidation).toBeInstanceOf(Function);
    expect(useComputedFields).toBeInstanceOf(Function);
    expect(useDataSource).toBeInstanceOf(Function);
  });

  it('renders and submits a minimal schema', async () => {
    const schema: UnifiedFormSchema = {
      $id: 'smoke-test',
      version: '1.0.0',
      metadata: {
        title: 'Smoke Test Form',
        sensitivity: 'low',
      },
      steps: [
        {
          id: 'primary',
          title: 'Primary Information',
          schema: {
            type: 'object',
            properties: {
              fullName: { type: 'string', minLength: 1 },
            },
            required: ['fullName'],
          },
        },
      ],
      transitions: [],
      ui: {
        widgets: {
          fullName: {
            component: 'Text',
            label: 'Full Name',
            props: {
              placeholder: 'Jane Doe',
            },
          },
        },
      },
    };

    const handleSubmit = jest.fn();

    render(<FormEngine.FormRenderer schema={schema} onSubmit={handleSubmit} />);

    const input = await screen.findByRole('textbox', { name: /full name/i });
    expect(input).toBeInTheDocument();

    fireEvent.change(input, { target: { value: 'Ada Lovelace' } });
    fireEvent.click(screen.getByRole('button', { name: /submit/i }));

    await waitFor(() => {
      expect(handleSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          fullName: 'Ada Lovelace',
          _meta: expect.objectContaining({
            schemaId: 'smoke-test',
            schemaVersion: '1.0.0',
          }),
        }),
      );
    });
  });
});
