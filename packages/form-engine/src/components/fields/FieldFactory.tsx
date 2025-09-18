'use client';

import * as React from 'react';

import { initializeFieldRegistry } from '../../core/field-registry';
import type { FieldComponent } from '../../core/field-registry';
import type { WidgetType } from '../../types';
import type { FieldProps } from './types';
import { TextField } from './TextField';
import { withFieldWrapper } from './withFieldWrapper';

export interface FieldFactoryProps extends FieldProps {
  widget: WidgetType;
}

export const FieldFactory: React.FC<FieldFactoryProps> = ({ widget, ...props }) => {
  const registry = initializeFieldRegistry();
  const registration = registry.get(widget);

  const fallbackRegistration = React.useMemo<FieldComponent<FieldProps>>(
    () => ({
      component: TextField as React.ComponentType<FieldProps>
    }),
    []
  );

  const resolvedRegistration = React.useMemo<FieldComponent<FieldProps>>(() => {
    if (registration) {
      return {
        component: registration.component as React.ComponentType<FieldProps>,
        defaultProps: registration.defaultProps as Partial<FieldProps> | undefined,
        formatter: registration.formatter,
        parser: registration.parser,
        validator: registration.validator
      } satisfies FieldComponent<FieldProps>;
    }

    console.warn(`No field component registered for widget: ${widget}. Falling back to Text.`);

    const defaultRegistration = registry.get('Text');
    if (defaultRegistration) {
      return {
        component: defaultRegistration.component as React.ComponentType<FieldProps>,
        defaultProps: defaultRegistration.defaultProps as Partial<FieldProps> | undefined,
        formatter: defaultRegistration.formatter,
        parser: defaultRegistration.parser,
        validator: defaultRegistration.validator
      } satisfies FieldComponent<FieldProps>;
    }

    return fallbackRegistration;
  }, [fallbackRegistration, registration, registry, widget]);

  const WrappedComponent = React.useMemo(
    () => withFieldWrapper(resolvedRegistration.component),
    [resolvedRegistration.component]
  );

  const mergedProps = React.useMemo<FieldProps>(
    () => ({ ...(resolvedRegistration.defaultProps ?? {}), ...props }),
    [props, resolvedRegistration.defaultProps]
  );

  return <WrappedComponent {...mergedProps} />;
};
