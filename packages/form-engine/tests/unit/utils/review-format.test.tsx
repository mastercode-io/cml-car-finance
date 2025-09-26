import * as React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

import type { UnifiedFormSchema } from '@form-engine/types';

import { formatValue } from '../../../src/utils/review-format';

describe('review-format', () => {
  const baseSchema: UnifiedFormSchema = {
    $id: 'test-schema',
    version: '1.0.0',
    metadata: { title: 'Test', sensitivity: 'low' },
    steps: [],
    transitions: [],
    ui: {
      widgets: {
        confirmAccuracy: { component: 'Checkbox', label: 'Confirm accuracy' },
        status: {
          component: 'Select',
          label: 'Status',
          options: [
            { label: 'Approved', value: 'approved' },
            { label: 'Pending', value: 'pending' },
          ],
        },
        references: {
          component: 'Repeater',
          label: 'References',
          fields: [
            { name: 'name', component: 'Text', label: 'Name' },
            { name: 'relationship', component: 'Text', label: 'Relationship' },
            { name: 'contact', component: 'Text', label: 'Contact' },
          ],
        },
        name: { component: 'Text', label: 'Name' },
        relationship: { component: 'Text', label: 'Relationship' },
        contact: { component: 'Text', label: 'Contact' },
      },
    },
  };

  it('formats primitive values', () => {
    expect(formatValue(true, 'confirmAccuracy', baseSchema, baseSchema.ui.widgets.confirmAccuracy)).toBe('Yes');
    expect(formatValue(false, 'confirmAccuracy', baseSchema, baseSchema.ui.widgets.confirmAccuracy)).toBe('No');
    expect(formatValue(42, 'score', baseSchema, undefined)).toBe('42');
    expect(formatValue('Hello', 'greeting', baseSchema, undefined)).toBe('Hello');
  });

  it('returns an em dash for empty-like values', () => {
    expect(formatValue(null, 'empty', baseSchema, undefined)).toBe('—');
    expect(formatValue(undefined, 'missing', baseSchema, undefined)).toBe('—');
    expect(formatValue('', 'blank', baseSchema, undefined)).toBe('—');
    expect(formatValue([], 'list', baseSchema, undefined)).toBe('—');
    expect(formatValue({}, 'object', baseSchema, undefined)).toBe('—');
  });

  it('maps select and radio values to their labels', () => {
    expect(
      formatValue('approved', 'status', baseSchema, baseSchema.ui.widgets.status),
    ).toBe('Approved');
  });

  it('formats arrays of scalars as comma-separated text', () => {
    const widget = {
      component: 'Select',
      label: 'Tags',
      options: [
        { label: 'Alpha', value: 'alpha' },
        { label: 'Beta', value: 'beta' },
      ],
    } as (typeof baseSchema.ui.widgets)['status'];

    const formatted = formatValue(['alpha', 'beta'], 'tags', baseSchema, widget);
    expect(formatted).toBe('Alpha, Beta');
  });

  it('formats arrays of objects using field labels', () => {
    const value = [
      {
        name: 'Ada Lovelace',
        relationship: 'Mentor',
        contact: 'ada@example.com',
      },
      {
        name: 'Grace Hopper',
        relationship: 'Supervisor',
        contact: '',
      },
    ];

    const formatted = formatValue(
      value,
      'references',
      baseSchema,
      baseSchema.ui.widgets.references,
    );

    const markup = renderToStaticMarkup(<>{formatted}</>);
    expect(markup).toContain('Ada Lovelace');
    expect(markup).toContain('Mentor');
    expect(markup).toContain('Grace Hopper');
    expect(markup).not.toContain('{');
  });

  it('omits empty child values when formatting objects', () => {
    const formatted = formatValue(
      {
        name: 'Ada Lovelace',
        relationship: '',
        contact: null,
      },
      'references',
      baseSchema,
      baseSchema.ui.widgets.references,
    );

    const markup = renderToStaticMarkup(<>{formatted}</>);
    expect(markup).toContain('Ada Lovelace');
    expect(markup).not.toContain('Relationship');
    expect(markup).not.toContain('Contact');
  });

  it('handles nested arrays within arrays without leaking JSON', () => {
    const formatted = formatValue(
      [
        ['alpha', 'beta'],
        ['gamma'],
      ],
      'nested',
      baseSchema,
      undefined,
    );

    const markup = renderToStaticMarkup(<>{formatted}</>);
    expect(markup).not.toContain('{');
  });
});

