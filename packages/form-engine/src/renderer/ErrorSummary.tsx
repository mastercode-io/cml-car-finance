'use client';

import * as React from 'react';
import type { FieldErrors } from 'react-hook-form';

import { flattenFieldErrors } from './utils';

interface ErrorSummaryProps {
  errors: FieldErrors;
  onFocusField?: (fieldName: string) => void;
}

export const ErrorSummary: React.FC<ErrorSummaryProps> = ({ errors, onFocusField }) => {
  const items = React.useMemo(() => flattenFieldErrors(errors), [errors]);

  if (items.length === 0) {
    return null;
  }

  return (
    <section
      role="alert"
      aria-live="polite"
      className="rounded-md border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive"
    >
      <p className="font-semibold">Please review the highlighted fields</p>
      <ul className="mt-2 space-y-1">
        {items.map((item) => (
          <li key={item.name}>
            <button
              type="button"
              onClick={() => onFocusField?.(item.name)}
              className="font-medium underline decoration-dotted underline-offset-2 hover:decoration-solid focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              {item.name}
            </button>
            {item.message ? `: ${item.message}` : null}
          </li>
        ))}
      </ul>
    </section>
  );
};
