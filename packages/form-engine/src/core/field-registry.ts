import type React from 'react';

import { CheckboxField } from '../components/fields/CheckboxField';
import { DateField } from '../components/fields/DateField';
import type { FieldProps } from '../components/fields/types';
import { NumberField } from '../components/fields/NumberField';
import { SelectField } from '../components/fields/SelectField';
import { TextAreaField } from '../components/fields/TextAreaField';
import { TextField } from '../components/fields/TextField';
import type { WidgetType } from '../types';

export interface FieldComponent<TProps extends FieldProps = FieldProps> {
  component: React.ComponentType<TProps>;
  defaultProps?: Partial<TProps>;
  validator?: (value: unknown) => boolean | string;
  formatter?: (value: unknown) => unknown;
  parser?: (value: unknown) => unknown;
}

export class FieldRegistry {
  private static instance: FieldRegistry | null = null;

  private fields: Map<WidgetType, FieldComponent<any>> = new Map();

  static getInstance(): FieldRegistry {
    if (!FieldRegistry.instance) {
      FieldRegistry.instance = new FieldRegistry();
    }
    return FieldRegistry.instance;
  }

  static reset(): void {
    if (!FieldRegistry.instance) {
      return;
    }

    FieldRegistry.instance.fields.clear();
    FieldRegistry.instance = null;
  }

  register(type: WidgetType, field: FieldComponent<any>): void {
    if (this.fields.has(type)) {
      console.warn(`Field type ${type} is being overridden`);
    }

    this.fields.set(type, field);
  }

  get(type: WidgetType): FieldComponent<any> | undefined {
    return this.fields.get(type);
  }

  getComponent(type: WidgetType): React.ComponentType<FieldProps> {
    const field = this.get(type);
    if (!field) {
      throw new Error(`Unknown field type: ${type}`);
    }
    return field.component as React.ComponentType<FieldProps>;
  }

  list(): WidgetType[] {
    return Array.from(this.fields.keys());
  }
}

export function initializeFieldRegistry(): FieldRegistry {
  const registry = FieldRegistry.getInstance();

  if (registry.list().length === 0) {
    registry.register('Text', { component: TextField });
    registry.register('Number', { component: NumberField });
    registry.register('TextArea', { component: TextAreaField });
    registry.register('Select', {
      component: SelectField as React.ComponentType<any>
    });
    registry.register('Checkbox', { component: CheckboxField });
    registry.register('Date', { component: DateField });
  }

  return registry;
}
