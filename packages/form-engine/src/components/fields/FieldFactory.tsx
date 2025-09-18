'use client';

import * as React from 'react';

import type { FieldProps } from './types';
import { CheckboxField } from './CheckboxField';
import { DateField } from './DateField';
import { NumberField } from './NumberField';
import { SelectField } from './SelectField';
import { TextAreaField } from './TextAreaField';
import { TextField } from './TextField';
import type { WidgetType } from '../../types';

const registry: Partial<Record<WidgetType, React.ComponentType<FieldProps>>> = {
  Text: TextField,
  Number: NumberField,
  TextArea: TextAreaField,
  Select: SelectField,
  Checkbox: CheckboxField,
  Date: DateField
};

export function registerFieldComponent(type: WidgetType, component: React.ComponentType<FieldProps>): void {
  registry[type] = component;
}

export function getFieldComponent(type: WidgetType): React.ComponentType<FieldProps> {
  const component = registry[type];
  if (!component) {
    throw new Error(`No field component registered for widget: ${type}`);
  }
  return component;
}

export interface FieldFactoryProps extends FieldProps {
  widget: WidgetType;
}

export const FieldFactory: React.FC<FieldFactoryProps> = ({ widget, ...props }) => {
  const Component = getFieldComponent(widget);
  return <Component {...props} />;
};
