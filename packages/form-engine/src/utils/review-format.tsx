import * as React from 'react';
import type { ReactNode } from 'react';

import type { UnifiedFormSchema } from '../types';
import type { RepeaterItemConfig } from '../types/ui.types';

const EMPTY_PLACEHOLDER = '—';

type WidgetConfigLike = {
  label?: string;
  options?: Array<{ label: string; value: string | number }>;
  fields?: RepeaterItemConfig[];
};

const isPlainObject = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
};

const isEmptyValue = (value: unknown): boolean => {
  if (value === null || value === undefined) return true;

  if (typeof value === 'string') {
    return value.trim().length === 0;
  }

  if (Array.isArray(value)) {
    return value.length === 0 || value.every((item) => isEmptyValue(item));
  }

  if (isPlainObject(value)) {
    const entries = Object.values(value);
    return entries.length === 0 || entries.every((item) => isEmptyValue(item));
  }

  return false;
};

const findOptionLabel = (
  value: unknown,
  widgetConfig?: WidgetConfigLike,
): string | undefined => {
  const options = widgetConfig?.options;
  if (!Array.isArray(options)) return undefined;

  return options.find((option) => {
    if (option.value === value) return true;

    if (typeof option.value === 'number') {
      if (typeof value === 'string' && value !== '' && Number(value) === option.value) {
        return true;
      }
    }

    if (typeof option.value === 'string') {
      if (typeof value === 'number' && String(value) === option.value) {
        return true;
      }
    }

    return false;
  })?.label;
};

const getChildWidgetConfig = (
  field: string,
  schema: UnifiedFormSchema,
  parentConfig?: WidgetConfigLike,
): WidgetConfigLike | undefined => {
  const repeaterField = parentConfig?.fields?.find((item) => item.name === field);
  if (repeaterField) {
    return repeaterField;
  }
  return schema.ui?.widgets?.[field];
};

const getFieldLabel = (
  field: string,
  schema: UnifiedFormSchema,
  widgetConfig?: WidgetConfigLike,
): string => {
  const repeaterField = widgetConfig?.fields?.find((item) => item.name === field);
  if (repeaterField?.label) {
    return repeaterField.label;
  }

  const schemaWidget = schema.ui?.widgets?.[field];
  if (schemaWidget?.label) {
    return schemaWidget.label;
  }

  return field;
};

const formatPrimitive = (
  value: string | number | boolean,
  widgetConfig?: WidgetConfigLike,
): string => {
  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No';
  }

  const optionLabel = findOptionLabel(value, widgetConfig);
  if (optionLabel) {
    return optionLabel;
  }

  return String(value);
};

const formatObjectValue = (
  value: Record<string, unknown>,
  schema: UnifiedFormSchema,
  widgetConfig?: WidgetConfigLike,
): ReactNode => {
  const keys = Object.keys(value).sort();
  const rows: React.ReactElement[] = [];

  keys.forEach((key) => {
    const childValue = value[key];
    if (isEmptyValue(childValue)) {
      return;
    }

    const childConfig = getChildWidgetConfig(key, schema, widgetConfig);
    const formattedChild = formatValue(childValue, key, schema, childConfig);
    if (formattedChild === EMPTY_PLACEHOLDER) {
      return;
    }

    rows.push(
      <div key={key}>
        <dt>{getFieldLabel(key, schema, widgetConfig)}</dt>
        <dd>{formattedChild}</dd>
      </div>,
    );
  });

  if (rows.length === 0) {
    return EMPTY_PLACEHOLDER;
  }

  return <dl>{rows}</dl>;
};

export const formatValue = (
  value: unknown,
  _fieldName: string,
  schema: UnifiedFormSchema,
  widgetConfig?: WidgetConfigLike,
): ReactNode => {
  if (isEmptyValue(value)) {
    return EMPTY_PLACEHOLDER;
  }

  if (Array.isArray(value)) {
    if (value.length === 0) return EMPTY_PLACEHOLDER;

    const arrayContainsOnlyObjects = value.every((item) => isPlainObject(item));

    if (arrayContainsOnlyObjects) {
      const items = (value as Array<Record<string, unknown>>)
        .map((item, index) => {
          if (isEmptyValue(item)) return null;
          const formatted = formatObjectValue(item, schema, widgetConfig);
          if (formatted === EMPTY_PLACEHOLDER) return null;
          return <li key={index}>{formatted}</li>;
        })
        .filter(Boolean) as React.ReactElement[];

      if (items.length === 0) return EMPTY_PLACEHOLDER;
      return <ol>{items}</ol>;
    }

    const formattedScalars = value.reduce<Array<string | ReactNode>>((acc, item) => {
      if (item === null || item === undefined) {
        return acc;
      }

      if (Array.isArray(item) || isPlainObject(item)) {
        const nested = formatValue(item, _fieldName, schema, widgetConfig);
        if (nested !== EMPTY_PLACEHOLDER) {
          acc.push(nested);
        }
        return acc;
      }

      if (typeof item === 'string' || typeof item === 'number' || typeof item === 'boolean') {
        acc.push(formatPrimitive(item, widgetConfig));
        return acc;
      }

      acc.push(String(item));
      return acc;
    }, []);

    if (formattedScalars.length === 0) return EMPTY_PLACEHOLDER;

    if (formattedScalars.every((item) => typeof item === 'string')) {
      return (formattedScalars as string[]).join(', ');
    }

    return <ul>{formattedScalars.map((item, index) => <li key={index}>{item}</li>)}</ul>;
  }

  if (isPlainObject(value)) {
    return formatObjectValue(value, schema, widgetConfig);
  }

  if (typeof value === 'boolean') {
    return formatPrimitive(value, widgetConfig);
  }

  if (typeof value === 'number') {
    return formatPrimitive(value, widgetConfig);
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (trimmed.length === 0) return EMPTY_PLACEHOLDER;

    const optionLabel = findOptionLabel(value, widgetConfig);
    if (optionLabel) {
      return optionLabel;
    }

    return trimmed;
  }

  return String(value);
};

