'use client';

import * as React from 'react';

import { cn } from '../../utils/cn';

import type { FieldProps } from './types';

export function withFieldWrapper<P extends FieldProps>(
  Component: React.ComponentType<P>,
): React.FC<P> {
  const Wrapped: React.FC<P> = (props) => {
    const {
      label,
      error,
      description,
      required,
      helpText,
      name,
      id,
      wrapperClassName,
      ariaDescribedBy,
      ariaInvalid,
      ariaRequired,
      ...rest
    } = props;

    const generatedId = React.useId();
    const fieldId = id ?? (typeof name === 'string' ? name : generatedId) ?? generatedId;
    const errorMessage = typeof error === 'string' ? error : error?.message;
    const errorId = errorMessage ? `${fieldId}-error` : undefined;
    const descriptionId = description ? `${fieldId}-description` : undefined;
    const helpId = helpText ? `${fieldId}-help` : undefined;

    const describedBy = [ariaDescribedBy, descriptionId, helpId, errorId].filter(Boolean).join(' ');

    const componentProps: P = {
      ...(rest as P),
      name,
      id: fieldId,
      ariaDescribedBy: describedBy || undefined,
      ariaInvalid: ariaInvalid ?? Boolean(errorMessage),
      ariaRequired: ariaRequired ?? Boolean(required),
    };

    return (
      <div className={cn('space-y-2', wrapperClassName)} data-field-wrapper>
        {label ? (
          <label htmlFor={fieldId} className="text-sm font-medium text-foreground">
            {label}
            {required ? (
              <span aria-hidden="true" className="ml-1 text-destructive">
                *
              </span>
            ) : null}
          </label>
        ) : null}

        {description ? (
          <p id={descriptionId} className="text-sm text-muted-foreground">
            {description}
          </p>
        ) : null}

        <Component {...componentProps} />

        {helpText ? (
          <p id={helpId} className="text-xs text-muted-foreground">
            {helpText}
          </p>
        ) : null}

        {errorMessage ? (
          <p id={errorId} className="text-sm text-destructive" role="alert">
            {errorMessage}
          </p>
        ) : null}
      </div>
    );
  };

  Wrapped.displayName = `WithFieldWrapper(${Component.displayName || Component.name || 'Field'})`;

  return Wrapped;
}
