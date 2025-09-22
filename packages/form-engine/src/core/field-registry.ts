import type React from 'react';

import { CheckboxField } from '../components/fields/CheckboxField';
import { DateField } from '../components/fields/DateField';
import { FileUploadField } from '../components/fields/FileUploadField';
import type { FieldProps } from '../components/fields/types';
import { NumberField } from '../components/fields/NumberField';
import { SelectField } from '../components/fields/SelectField';
import { TextAreaField } from '../components/fields/TextAreaField';
import { TextField } from '../components/fields/TextField';
import { RadioGroupField } from '../components/fields/RadioGroupField';
import { RatingField } from '../components/fields/RatingField';
import { SliderField } from '../components/fields/SliderField';
import { RepeaterField } from '../components/fields/RepeaterField';
import { CurrencyField } from '../components/fields/specialized/CurrencyField';
import { EmailField } from '../components/fields/specialized/EmailField';
import { PhoneField } from '../components/fields/specialized/PhoneField';
import { PostcodeField } from '../components/fields/specialized/PostcodeField';
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

  private fields: Map<WidgetType, FieldComponent> = new Map();

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

  register(type: WidgetType, field: FieldComponent): void {
    if (this.fields.has(type)) {
      console.warn(`Field type ${type} is being overridden`);
    }

    this.fields.set(type, field);
  }

  get(type: WidgetType): FieldComponent | undefined {
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
    const defaultRegistrations: Array<[WidgetType, FieldComponent]> = [
      ['Text', { component: TextField as unknown as React.ComponentType<FieldProps> }],
      ['Number', { component: NumberField as unknown as React.ComponentType<FieldProps> }],
      ['TextArea', { component: TextAreaField as unknown as React.ComponentType<FieldProps> }],
      ['Select', { component: SelectField as unknown as React.ComponentType<FieldProps> }],
      ['Checkbox', { component: CheckboxField as unknown as React.ComponentType<FieldProps> }],
      ['Date', { component: DateField as unknown as React.ComponentType<FieldProps> }],
      ['RadioGroup', { component: RadioGroupField as unknown as React.ComponentType<FieldProps> }],
      ['Repeater', { component: RepeaterField as unknown as React.ComponentType<FieldProps> }],
      ['FileUpload', { component: FileUploadField as unknown as React.ComponentType<FieldProps> }],
      ['Slider', { component: SliderField as unknown as React.ComponentType<FieldProps> }],
      ['Rating', { component: RatingField as unknown as React.ComponentType<FieldProps> }],
      ['Currency', { component: CurrencyField as unknown as React.ComponentType<FieldProps> }],
      ['Phone', { component: PhoneField as unknown as React.ComponentType<FieldProps> }],
      ['Postcode', { component: PostcodeField as unknown as React.ComponentType<FieldProps> }],
      ['Email', { component: EmailField as unknown as React.ComponentType<FieldProps> }],
    ];

    defaultRegistrations.forEach(([type, component]) => {
      registry.register(type, component);
    });
  }

  return registry;
}
