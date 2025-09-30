import * as React from 'react';
import { act, render, screen, waitFor } from '@testing-library/react';

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

  it('renders section titles and descriptions as accessible regions', () => {
    const schema = buildSchema({
      type: 'grid',
      columns: { base: 4 },
      sections: [
        {
          id: 'contact-info',
          title: 'Contact information',
          description: 'How we will stay in touch',
          rows: [
            {
              fields: [
                { name: 'firstName', colSpan: { base: 2 } },
                { name: 'lastName', colSpan: { base: 2 } },
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
        visibleFields={['firstName', 'lastName']}
        renderField={renderField}
        testBreakpoint="base"
      />,
    );

    const section = container.querySelector(
      '[data-grid-section="contact-info"]',
    ) as HTMLElement;
    expect(section).not.toBeNull();
    expect(section.tagName.toLowerCase()).toBe('section');
    expect(section.getAttribute('role')).toBe('region');

    const heading = section.querySelector('[data-grid-section-title]');
    expect(heading).not.toBeNull();
    expect(heading?.textContent).toBe('Contact information');
    expect(heading?.tagName.toLowerCase()).toBe('h3');
    expect(section.getAttribute('data-grid-section-heading-level')).toBe('h3');

    const description = section.querySelector('[data-grid-section-description]');
    expect(description).not.toBeNull();
    expect(description?.textContent).toBe('How we will stay in touch');

    const header = section.querySelector('[data-grid-section-header]');
    const row = section.querySelector('[data-grid-row]');
    expect(header).not.toBeNull();
    expect(row).not.toBeNull();
    expect(section.firstElementChild).toBe(header);
    expect(header?.nextElementSibling).toBe(row);

    if (heading instanceof HTMLElement) {
      expect(section.getAttribute('aria-labelledby')).toBe(heading.id);
    }

    if (description instanceof HTMLElement) {
      expect(section.getAttribute('aria-describedby')).toBe(description.id);
    }
  });

  it('labels untitled sections using fallback aria-labels', () => {
    const schema = buildSchema({
      type: 'grid',
      columns: { base: 4 },
      sections: [
        {
          id: 'supporting-details',
          description: 'Additional context',
          rows: [
            {
              fields: [{ name: 'notes', colSpan: { base: 4 } }],
            },
          ],
        },
      ],
    });

    const { container } = render(
      <GridRenderer
        schema={schema}
        stepProperties={stepProperties}
        visibleFields={['notes']}
        renderField={renderField}
        testBreakpoint="base"
      />,
    );

    const section = container.querySelector(
      '[data-grid-section="supporting-details"]',
    ) as HTMLElement;
    expect(section).not.toBeNull();
    expect(section.getAttribute('role')).toBe('region');
    expect(section.getAttribute('aria-label')).toBe('Additional context');
    expect(section.getAttribute('aria-describedby')).toBeNull();

    const row = section.querySelector('[data-grid-row]');
    expect(row).not.toBeNull();
  });

  it('supports customizing heading levels per section', () => {
    const schema = buildSchema({
      type: 'grid',
      columns: { base: 4 },
      sectionHeadingLevel: 5,
      sections: [
        {
          id: 'primary-info',
          title: 'Primary',
          headingLevel: 2,
          rows: [
            {
              fields: [
                { name: 'firstName', colSpan: { base: 2 } },
                { name: 'lastName', colSpan: { base: 2 } },
              ],
            },
          ],
        },
        {
          id: 'secondary-info',
          title: 'Secondary',
          headingLevel: 8,
          rows: [
            {
              fields: [{ name: 'email', colSpan: { base: 4 } }],
            },
          ],
        },
        {
          id: 'tertiary-info',
          title: 'Tertiary',
          rows: [
            {
              fields: [{ name: 'notes', colSpan: { base: 4 } }],
            },
          ],
        },
      ],
    });

    const { container } = render(
      <GridRenderer
        schema={schema}
        stepProperties={stepProperties}
        visibleFields={['firstName', 'lastName', 'email', 'notes']}
        renderField={renderField}
        testBreakpoint="base"
      />,
    );

    const sections = container.querySelectorAll('[data-grid-section]');
    expect(sections).toHaveLength(3);

    const [primary, secondary, tertiary] = Array.from(sections);

    const primaryHeading = primary.querySelector(
      '[data-grid-section-title]',
    ) as HTMLElement;
    const secondaryHeading = secondary.querySelector(
      '[data-grid-section-title]',
    ) as HTMLElement;
    const tertiaryHeading = tertiary.querySelector(
      '[data-grid-section-title]',
    ) as HTMLElement;

    expect(primaryHeading.tagName).toBe('H2');
    expect(primary.getAttribute('data-grid-section-heading-level')).toBe('h2');
    expect(secondaryHeading.tagName).toBe('H6');
    expect(secondary.getAttribute('data-grid-section-heading-level')).toBe('h6');
    expect(tertiaryHeading.tagName).toBe('H5');
    expect(tertiary.getAttribute('data-grid-section-heading-level')).toBe('h5');
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

  it('reserves space for error messages and aligns rows to prevent layout jumps', () => {
    const schema = buildSchema({
      type: 'grid',
      columns: { base: 4 },
      rowGap: { base: 16 },
      sections: [
        {
          id: 'primary',
          rows: [
            {
              fields: [
                { name: 'firstName', colSpan: { base: 2 } },
                { name: 'lastName', colSpan: { base: 2 } },
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
        visibleFields={['firstName', 'lastName']}
        renderField={renderField}
        testBreakpoint="base"
      />,
    );

    const row = container.querySelector('[data-grid-row]') as HTMLElement;
    expect(row).not.toBeNull();
    expect(row.style.alignItems).toBe('start');

    const firstField = row.querySelector('[data-grid-field="firstName"]') as HTMLElement;
    const secondField = row.querySelector('[data-grid-field="lastName"]') as HTMLElement;

    expect(firstField.style.getPropertyValue('--grid-field-error-slot')).toBe('24px');
    expect(secondField.style.getPropertyValue('--grid-field-error-slot')).toBe('24px');

    const fallbackSchema = buildSchema({
      type: 'grid',
      columns: { base: 4 },
      rowGap: { base: 32 },
      sections: [
        {
          id: 'primary',
          rows: [
            {
              fields: [{ name: 'firstName', colSpan: { base: 2 } }],
            },
          ],
        },
      ],
    });

    const { container: fallbackContainer } = render(
      <GridRenderer
        schema={fallbackSchema}
        stepProperties={stepProperties}
        visibleFields={['firstName', 'lastName']}
        renderField={renderField}
        testBreakpoint="base"
      />,
    );

    const fallbackRow = fallbackContainer.querySelector('[data-grid-row="fallback"]') as HTMLElement;
    expect(fallbackRow).not.toBeNull();
    expect(fallbackRow.style.alignItems).toBe('start');

    const fallbackField = fallbackRow.querySelector('[data-grid-field="lastName"]') as HTMLElement;
    expect(fallbackField.style.getPropertyValue('--grid-field-error-slot')).toBe('32px');
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

  it('uses widget layout hints when the section configuration omits placement details', () => {
    const schema = buildSchema({
      type: 'grid',
      columns: { base: 4 },
      sections: [
        {
          id: 'primary',
          rows: [
            {
              fields: [{ name: 'firstName' }, { name: 'lastName' }],
            },
          ],
        },
      ],
    });

    schema.ui!.widgets.firstName = {
      ...schema.ui!.widgets.firstName!,
      layout: { colSpan: { base: 3 }, align: 'start', size: 'sm' },
    };
    schema.ui!.widgets.lastName = {
      ...schema.ui!.widgets.lastName!,
      layout: { colSpan: { base: 1 }, align: 'end', size: 'lg' },
    };

    const { container } = render(
      <GridRenderer
        schema={schema}
        stepProperties={stepProperties}
        visibleFields={['firstName', 'lastName']}
        renderField={renderField}
        testBreakpoint="base"
      />,
    );

    const first = container.querySelector('[data-grid-field="firstName"]') as HTMLElement;
    const last = container.querySelector('[data-grid-field="lastName"]') as HTMLElement;

    expect(first.style.gridColumn).toBe('span 3 / span 3');
    expect(first.dataset.gridFieldAlign).toBe('start');
    expect(first.classList.contains('max-w-sm')).toBe(true);

    expect(last.style.gridColumn).toBe('span 1 / span 1');
    expect(last.dataset.gridFieldAlign).toBe('end');
    expect(last.classList.contains('max-w-lg')).toBe(true);
  });

  it('gives precedence to explicit layout settings over widget layout hints', () => {
    const schema = buildSchema({
      type: 'grid',
      columns: { base: 4 },
      sections: [
        {
          id: 'primary',
          rows: [
            {
              fields: [
                { name: 'firstName', colSpan: { base: 2 }, align: 'stretch', size: 'xl' },
                { name: 'lastName', colSpan: { base: 2 } },
              ],
            },
          ],
        },
      ],
    });

    schema.ui!.widgets.firstName = {
      ...schema.ui!.widgets.firstName!,
      layout: { colSpan: { base: 3 }, align: 'end', size: 'sm' },
    };

    const { container } = render(
      <GridRenderer
        schema={schema}
        stepProperties={stepProperties}
        visibleFields={['firstName', 'lastName']}
        renderField={renderField}
        testBreakpoint="base"
      />,
    );

    const first = container.querySelector('[data-grid-field="firstName"]') as HTMLElement;

    expect(first.style.gridColumn).toBe('span 2 / span 2');
    expect(first.dataset.gridFieldAlign).toBeUndefined();
    expect(first.classList.contains('max-w-xl')).toBe(true);
  });

  it('applies widget layout hints to fallback fields', () => {
    const schema = buildSchema({
      type: 'grid',
      columns: { base: 4 },
      sections: [
        {
          id: 'primary',
          rows: [
            {
              fields: [{ name: 'firstName', colSpan: { base: 2 } }],
            },
          ],
        },
      ],
    });

    schema.ui!.widgets.notes = {
      ...schema.ui!.widgets.notes!,
      layout: {
        colSpan: { base: 2 },
        order: { base: -1 },
        align: 'center',
        size: 'md',
      },
    };

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
    const fallbackField = fallbackRow?.querySelector('[data-grid-field="notes"]') as HTMLElement;
    expect(fallbackField).toBeDefined();
    expect(fallbackField.style.gridColumn).toBe('span 2 / span 2');
    expect(fallbackField.dataset.gridFieldAlign).toBe('center');
    expect(fallbackField.classList.contains('max-w-md')).toBe(true);

    const firstRow = container.querySelector('[data-grid-row]:not([data-grid-row="fallback"])');
    const firstField = firstRow?.querySelector('[data-grid-field="firstName"]') as HTMLElement;
    expect(firstField.style.gridColumn).toBe('span 2 / span 2');
  });

  it('responds to viewport changes by updating breakpoints and column counts', async () => {
    const originalInnerWidth = window.innerWidth;
    Object.defineProperty(window, 'innerWidth', {
      configurable: true,
      writable: true,
      value: 1100,
    });

    try {
      const schema = buildSchema({
        type: 'grid',
        columns: { md: 6, lg: 8 },
        sections: [
          {
            id: 'primary',
            rows: [
              {
                fields: [
                  { name: 'firstName', colSpan: { md: 3 } },
                  { name: 'lastName', colSpan: { md: 3 } },
                  { name: 'email', colSpan: { md: 6 } },
                ],
              },
            ],
          },
        ],
      });

      render(
        <GridRenderer
          schema={schema}
          stepProperties={stepProperties}
          visibleFields={['firstName', 'lastName', 'email']}
          renderField={renderField}
        />,
      );

      await waitFor(() => {
        const container = document.querySelector('[data-grid-breakpoint="lg"]');
        expect(container).not.toBeNull();
      });

      const wideRow = document.querySelector('[data-grid-row]') as HTMLElement;
      expect(wideRow.style.getPropertyValue('--cols')).toBe('8');
      expect(wideRow.style.getPropertyValue('--cols-lg')).toBe('8');

      act(() => {
        window.innerWidth = 500;
        window.dispatchEvent(new Event('resize'));
      });

      await waitFor(() => {
        const container = document.querySelector('[data-grid-breakpoint="base"]');
        expect(container).not.toBeNull();
      });

      const narrowRow = document.querySelector('[data-grid-row]') as HTMLElement;
      expect(narrowRow.style.getPropertyValue('--cols')).toBe('1');
      expect(narrowRow.style.getPropertyValue('--cols-base')).toBe('1');
    } finally {
      Object.defineProperty(window, 'innerWidth', {
        configurable: true,
        writable: true,
        value: originalInnerWidth,
      });
    }
  });
});

