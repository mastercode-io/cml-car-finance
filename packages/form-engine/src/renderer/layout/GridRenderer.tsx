import * as React from 'react';

import type {
  JSONSchema,
  LayoutBreakpoint,
  UnifiedFormSchema,
} from '../../types';
import {
  computeGridStyles,
  computeItemStyles,
  inferBreakpointFromWidth,
  mergeLayout,
  resolveBreakpoint,
} from './responsive';

export interface GridRendererProps {
  schema: UnifiedFormSchema;
  stepProperties: Record<string, JSONSchema>;
  visibleFields: string[];
  renderField: (fieldName: string) => React.ReactNode;
  testBreakpoint?: LayoutBreakpoint;
}

export const GridRenderer: React.FC<GridRendererProps> = ({
  schema,
  stepProperties,
  visibleFields,
  renderField,
  testBreakpoint,
}) => {
  const layout = schema.ui?.layout;
  const widgetDefinitions = schema.ui?.widgets ?? {};
  const breakpointOverrides = React.useMemo(
    () => layout?.breakpoints ?? {},
    [layout?.breakpoints],
  );

  const [activeBreakpoint, setActiveBreakpoint] = React.useState<LayoutBreakpoint>(
    testBreakpoint ?? 'base',
  );

  React.useEffect(() => {
    if (testBreakpoint) {
      setActiveBreakpoint(testBreakpoint);
      return;
    }

    if (typeof window === 'undefined') {
      setActiveBreakpoint('base');
      return;
    }

    const handleResize = () => {
      setActiveBreakpoint(
        inferBreakpointFromWidth(window.innerWidth, breakpointOverrides),
      );
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [breakpointOverrides, testBreakpoint]);

  const visibleFieldSet = React.useMemo(() => new Set(visibleFields), [visibleFields]);
  const stepFieldSet = React.useMemo(
    () => new Set(Object.keys(stepProperties ?? {})),
    [stepProperties],
  );

  if (!layout?.sections || layout.sections.length === 0) {
    return (
      <div data-grid-fallback="single-column" className="space-y-4">
        {visibleFields.map((fieldName) => {
          const node = renderField(fieldName);
          if (!node) {
            return null;
          }

          return <React.Fragment key={fieldName}>{node}</React.Fragment>;
        })}
      </div>
    );
  }

  const gridStyles = React.useMemo(
    () => computeGridStyles(layout, activeBreakpoint),
    [layout, activeBreakpoint],
  );

  const configuredFields = new Set<string>();
  const hiddenFields = new Set<string>();
  const sectionNodes: React.ReactNode[] = [];

  layout.sections.forEach((section) => {
    if (!section || !Array.isArray(section.rows)) {
      return;
    }

    const rowNodes: React.ReactNode[] = [];

    section.rows.forEach((row, rowIndex) => {
      if (!row || !Array.isArray(row.fields)) {
        return;
      }

      const fieldNodes = row.fields
        .map((fieldConfig, index) => {
          if (!fieldConfig || typeof fieldConfig.name !== 'string') {
            return null;
          }

          const fieldName = fieldConfig.name;
          if (!stepFieldSet.has(fieldName) || !visibleFieldSet.has(fieldName)) {
            return null;
          }

          const mergedLayout = mergeLayout(
            fieldConfig,
            widgetDefinitions[fieldName]?.layout,
          );

          const hidden = resolveBreakpoint(mergedLayout.hide, activeBreakpoint);
          if (hidden === true) {
            hiddenFields.add(fieldName);
            return null;
          }

          const fieldNode = renderField(fieldName);
          if (!fieldNode) {
            return null;
          }

          configuredFields.add(fieldName);

          const item = computeItemStyles(mergedLayout, activeBreakpoint, gridStyles.columns);

          const hasExplicitOrder = typeof item.order === 'number';
          const orderValue = hasExplicitOrder ? (item.order as number) : index + 0.5;

          return {
            order: orderValue,
            sourceIndex: index,
            node: (
              <div
                key={fieldName}
                data-grid-field={fieldName}
                style={item.style}
              >
                {fieldNode}
              </div>
            ),
          };
        })
        .filter(
          (
            entry,
          ): entry is {
            order: number;
            sourceIndex: number;
            node: React.ReactElement;
          } => entry !== null,
        )
        .sort((a, b) => {
          if (a.order !== b.order) {
            return a.order - b.order;
          }
          return a.sourceIndex - b.sourceIndex;
        })
        .map((entry) => entry.node);

      if (fieldNodes.length === 0) {
        return;
      }

      rowNodes.push(
        <div
          key={`${section.id}-row-${rowIndex}`}
          className="grid"
          data-grid-row
          style={gridStyles.style}
        >
          {fieldNodes}
        </div>,
      );
    });

    if (rowNodes.length > 0) {
      sectionNodes.push(
        <div key={section.id} className="space-y-4" data-grid-section={section.id}>
          {rowNodes}
        </div>,
      );
    }
  });

  const fallbackFields = visibleFields.filter(
    (field) => !configuredFields.has(field) && !hiddenFields.has(field),
  );

  if (fallbackFields.length > 0) {
    const fallbackItem = computeItemStyles(
      { colSpan: { base: gridStyles.columns } },
      activeBreakpoint,
      gridStyles.columns,
    );

    sectionNodes.push(
      <div key="__fallback" className="grid" data-grid-row="fallback" style={gridStyles.style}>
        {fallbackFields.map((fieldName) => {
          const node = renderField(fieldName);
          if (!node) {
            return null;
          }

          return (
            <div key={fieldName} data-grid-field={fieldName} style={fallbackItem.style}>
              {node}
            </div>
          );
        })}
      </div>,
    );
  }

  if (sectionNodes.length === 0) {
    return (
      <div data-grid-fallback="single-column" className="space-y-4">
        {visibleFields.map((fieldName) => {
          const node = renderField(fieldName);
          if (!node) {
            return null;
          }

          return <React.Fragment key={fieldName}>{node}</React.Fragment>;
        })}
      </div>
    );
  }

  return (
    <div className="space-y-8" data-grid-breakpoint={activeBreakpoint}>
      {sectionNodes}
    </div>
  );
};
