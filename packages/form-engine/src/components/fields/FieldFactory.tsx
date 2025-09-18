'use client';

import * as React from 'react';

import { initializeFieldRegistry } from '../../core/field-registry';
import type { WidgetType } from '../../types';
import type { FieldProps } from './types';
import { TextField } from './TextField';

export interface FieldFactoryProps extends FieldProps {
  widget: WidgetType;
}

export const FieldFactory: React.FC<FieldFactoryProps> = ({ widget, ...props }) => {
  const registry = initializeFieldRegistry();
  const registration = registry.get(widget);

  if (!registration) {
    console.warn(`No field component registered for widget: ${widget}. Falling back to Text.`);
    const fallback = registry.get('Text');

    if (!fallback) {
      const FallbackComponent = TextField;
      return <FallbackComponent {...props} />;
    }

    const FallbackComponent = fallback.component;
    const fallbackProps: FieldProps = { ...(fallback.defaultProps ?? {}), ...props };
    return <FallbackComponent {...fallbackProps} />;
  }

  const Component = registration.component;
  const mergedProps: FieldProps = { ...(registration.defaultProps ?? {}), ...props };

  return <Component {...mergedProps} />;
};
