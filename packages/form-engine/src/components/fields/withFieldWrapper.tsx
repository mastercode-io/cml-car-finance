'use client';

import * as React from 'react';

import { cn } from '../../utils/cn';
import type { FieldProps } from './types';

export function withFieldWrapper<P extends FieldProps>(
  Component: React.ComponentType<P>
): React.FC<P> {
  const Wrapped: React.FC<P> = props => {
    const { label, error, description, required, className, helpText, name } = props;

    return (
      <div className={cn('space-y-2', className)}>
        {label ? (
          <label htmlFor={name} className="text-sm font-medium">
            {label}
            {required ? <span className="ml-1 text-red-500">*</span> : null}
          </label>
        ) : null}

        {description ? (
          <p className="text-sm text-muted-foreground">{description}</p>
        ) : null}

        <Component {...props} />

        {helpText ? (
          <p className="text-xs text-muted-foreground">{helpText}</p>
        ) : null}

        {error ? (
          <p className="text-sm text-destructive" role="alert">
            {typeof error === 'string' ? error : error.message}
          </p>
        ) : null}
      </div>
    );
  };

  Wrapped.displayName = `WithFieldWrapper(${Component.displayName || Component.name || 'Field'})`;

  return Wrapped;
}
