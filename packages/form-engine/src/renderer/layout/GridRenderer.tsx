import * as React from 'react';
import type { JSONSchema, UnifiedFormSchema } from '../../types';

export interface GridRendererProps {
  schema: UnifiedFormSchema;
  currentStepSchema: JSONSchema;
  stepProperties: Record<string, JSONSchema>;
  visibleFields: string[];
  mode: 'create' | 'edit' | 'view';
  isSessionExpired: boolean;
}

export const GridRenderer: React.FC<GridRendererProps> = () => {
  return <div data-testid="grid-renderer-placeholder" />;
};
