import * as React from 'react';
import { render, screen } from '@testing-library/react';

import type { JSONSchema, UnifiedFormSchema } from '../../../types';
import { GridRenderer } from '../GridRenderer';

const buildSchema = (layout: UnifiedFormSchema['ui']['layout']): UnifiedFormSchema => ({
  $id: 'test',
  version: '1.0.0',
  metadata: { title: 'Test', sensitivity: 'low' },
  steps: [],
  transitions: [],
  ui: {
    widgets: {
      firstName: { component: 'Text', label: 'First name' },
      lastName: { component: 'Text', label: 'Last name' },
      email: { component: 'Text', label: 'Email' },
      notes: { component: 'TextArea', label: 'Notes' },
      hiddenField: { component: 'Text', label: 'Hidden' },
    },
    layout,
    theme: undefined,
  },
  computed: [],
  dataSources: {},
});

const stepProperties: Record<string, JSONSchema> = {
  firstName: { type: 'string' },
  lastName: { type: 'string' },
  email: { type: 'string' },
  notes: { type: 'string' },
  hiddenField: { type: 'string' },
};

const renderField = (fieldName: string): React.ReactNode => (
  <div data-testid={`field-${fieldName}`}>{fieldName}</div>
);

describe('GridRenderer', () => {
  it('falls back to single column when no sections are configured', () => {
    const schema = buildSchema(undefined);

    const { container } = render(
      <GridRenderer
        schema={schema}
        stepProperties={stepProperties}
        visibleFields={['firstName', 'lastName']}
        renderField={renderField}
        testBreakpoint="base"
      />,
    );

    const fallback = container.querySelector('[data-grid-fallback="single-column"]');
    expect(fallback).not.toBeNull();
    expect(screen.getByTestId('field-firstName')).toBeInTheDocument();
    expect(screen.getByTestId('field-lastName')).toBeInTheDocument();
  });

  it('renders configured fields respecting spans and explicit order', () => {
    const schema = buildSchema({
      type: 'grid',
      columns: { base: 4 },
      sections: [
        {
          id: 'primary',
          rows: [
            {
              fields: [
                { name: 'firstName', colSpan: { base: 2 } },
                { name: 'lastName', colSpan: { base: 2 }, order: { base: 1 } },
                { name: 'email', colSpan: { base: 4 }, order: { base: 0 } },
              ],
            },
          ],
        },
      ],
    });

    const { asFragment, container } = render(
      <GridRenderer
        schema={schema}
        stepProperties={stepProperties}
        visibleFields={['firstName', 'lastName', 'email']}
        renderField={renderField}
        testBreakpoint="base"
      />,
    );

    const row = container.querySelector('[data-grid-row]');
    expect(row).not.toBeNull();
    const orderedFieldNames = Array.from(
      row?.querySelectorAll('[data-grid-field]') ?? [],
    ).map((node) => node.getAttribute('data-grid-field'));

    expect(orderedFieldNames).toEqual(['email', 'firstName', 'lastName']);
    expect(asFragment()).toMatchSnapshot();
  });

  it('appends unconfigured visible fields into a fallback row', () => {
    const schema = buildSchema({
      type: 'grid',
      columns: 4,
      sections: [
        {
          id: 'primary',
          rows: [
            {
              fields: [{ name: 'firstName', colSpan: 2 }],
            },
          ],
        },
      ],
    });

    const { container } = render(
      <GridRenderer
        schema={schema}
        stepProperties={stepProperties}
        visibleFields={['firstName', 'notes']}
        renderField={renderField}
        testBreakpoint="base"
      />,
    );

    const fallbackRow = container.querySelector('[data-grid-row="fallback"]');
    expect(fallbackRow).not.toBeNull();
    const fallbackFields = Array.from(
      fallbackRow?.querySelectorAll('[data-grid-field]') ?? [],
    ).map((node) => node.getAttribute('data-grid-field'));

    expect(fallbackFields).toEqual(['notes']);
  });

  it('excludes hidden fields from the rendered output and fallback rows', () => {
    const schema = buildSchema({
      type: 'grid',
      columns: 4,
      sections: [
        {
          id: 'primary',
          rows: [
            {
              fields: [
                { name: 'firstName', colSpan: 2 },
                { name: 'hiddenField', hide: { base: true } },
              ],
            },
          ],
        },
      ],
    });

    const { container } = render(
      <GridRenderer
        schema={schema}
        stepProperties={stepProperties}
        visibleFields={['firstName', 'hiddenField']}
        renderField={renderField}
        testBreakpoint="base"
      />,
    );

    expect(screen.getByTestId('field-firstName')).toBeInTheDocument();
    expect(screen.queryByTestId('field-hiddenField')).not.toBeInTheDocument();

    const fallbackRow = container.querySelector('[data-grid-row="fallback"]');
    if (fallbackRow) {
      const fallbackFields = Array.from(
        fallbackRow.querySelectorAll('[data-grid-field]'),
      ).map((node) => node.getAttribute('data-grid-field'));
      expect(fallbackFields).not.toContain('hiddenField');
    }
  });
});

