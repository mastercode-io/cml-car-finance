import { useCallback, useEffect, useRef } from 'react';

import { ComputedFieldEngine } from '../computed/ComputedFieldEngine';
import type { ComputedField } from '../types';

const normalizePath = (path: string): string => {
  if (!path) {
    return path;
  }
  if (path === '$' || path.startsWith('$.') || path.startsWith('$[')) {
    return path;
  }
  return `$.${path}`;
};

export function useComputedFields(
  computedFields: ComputedField[] | undefined,
  formData: Record<string, unknown>,
  onUpdate: (path: string, value: unknown) => void,
) {
  const engineRef = useRef<ComputedFieldEngine | null>(null);
  const fieldsRef = useRef<Map<string, ComputedField>>(new Map());
  const dataRef = useRef(formData);

  useEffect(() => {
    dataRef.current = formData;
  }, [formData]);

  useEffect(() => {
    if (!computedFields || computedFields.length === 0) {
      engineRef.current = null;
      fieldsRef.current = new Map();
      return;
    }

    const engine = new ComputedFieldEngine();
    const fieldMap = new Map<string, ComputedField>();

    computedFields.forEach((field) => {
      engine.registerComputedField(field);
      fieldMap.set(normalizePath(field.path), field);
    });

    const results = engine.evaluateAll(computedFields, dataRef.current);
    results.forEach((result) => {
      onUpdate(result.path, result.value);
    });

    engineRef.current = engine;
    fieldsRef.current = fieldMap;
  }, [computedFields, onUpdate]);

  const handleFieldChange = useCallback(
    (changedPath: string) => {
      const engine = engineRef.current;
      if (!engine) {
        return;
      }

      const normalized = normalizePath(changedPath);
      const affected = engine.getAffectedFields(normalized);

      affected.forEach((path) => {
        const field = fieldsRef.current.get(path);
        if (!field) {
          return;
        }

        const result = engine.evaluate(field, dataRef.current);
        onUpdate(field.path, result.value);
      });
    },
    [onUpdate],
  );

  const evaluateAll = useCallback(() => {
    const engine = engineRef.current;
    if (!engine || !computedFields || computedFields.length === 0) {
      return;
    }

    const results = engine.evaluateAll(computedFields, dataRef.current);
    results.forEach((result) => {
      onUpdate(result.path, result.value);
    });
  }, [computedFields, onUpdate]);

  return { handleFieldChange, evaluateAll } as const;
}
