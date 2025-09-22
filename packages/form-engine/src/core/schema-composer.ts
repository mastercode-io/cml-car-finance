import type { UnifiedFormSchema } from '../types';

interface OverrideDirective {
  reason: string;
}

class SchemaOverrideError extends Error {
  constructor(path: string, detail?: string) {
    const suffix = detail ? detail : 'Add { "override": true, "reason": "..." } to continue.';
    super(`Override guard failed at "${path}". ${suffix}`);
    this.name = 'SchemaOverrideError';
  }
}

export class SchemaComposer {
  private schemas: Map<string, UnifiedFormSchema> = new Map();

  constructor(initialSchemas?: UnifiedFormSchema[]) {
    initialSchemas?.forEach((schema) => this.schemas.set(schema.$id, schema));
  }

  register(schema: UnifiedFormSchema): void {
    this.schemas.set(schema.$id, schema);
  }

  async loadSchema(
    id: string,
    loader: (id: string) => Promise<UnifiedFormSchema>,
  ): Promise<UnifiedFormSchema> {
    if (this.schemas.has(id)) {
      return this.schemas.get(id)!;
    }

    const schema = await loader(id);
    this.schemas.set(id, schema);
    return schema;
  }

  compose(schema: UnifiedFormSchema): UnifiedFormSchema {
    if (!schema.extends?.length) {
      return schema;
    }

    const baseSchemas = schema.extends
      .map((id) => {
        const base = this.schemas.get(id);
        if (!base) {
          throw new Error(`Schema ${id} has not been registered`);
        }
        return base;
      })
      .map((base) => this.compose(base));

    const mergedBase = baseSchemas.reduce<UnifiedFormSchema | null>((acc, current) => {
      if (!acc) return current;
      return this.mergeSchemas(acc, current);
    }, null);

    return mergedBase ? this.mergeWithOverrides(mergedBase, schema) : schema;
  }

  private mergeSchemas(target: UnifiedFormSchema, source: UnifiedFormSchema): UnifiedFormSchema {
    const merged = this.deepMerge(target, source);
    merged.steps = this.mergeSteps(target.steps, source.steps);
    merged.transitions = this.mergeTransitions(target.transitions, source.transitions);
    return merged;
  }

  private mergeWithOverrides(
    base: UnifiedFormSchema,
    overrides: UnifiedFormSchema,
  ): UnifiedFormSchema {
    const merged = this.deepMerge(base, overrides);
    merged.steps = this.mergeSteps(base.steps, overrides.steps);
    merged.transitions = this.mergeTransitions(base.transitions, overrides.transitions);
    return merged;
  }

  private mergeSteps(
    base: UnifiedFormSchema['steps'],
    overrides: UnifiedFormSchema['steps'],
  ): UnifiedFormSchema['steps'] {
    const stepMap = new Map(base.map((step) => [step.id, step] as const));
    overrides.forEach((step) => {
      const path = `#/steps/${step.id}`;
      const { directive, cleaned } = this.extractOverrideDirective(step, path);
      const cleanedStep = cleaned as UnifiedFormSchema['steps'][number];
      const existing = stepMap.get(cleanedStep.id);
      if (existing) {
        const mergedStep = this.deepMerge(
          existing as Record<string, any>,
          cleanedStep as Record<string, any>,
          path,
          directive ?? null,
        ) as UnifiedFormSchema['steps'][number];
        stepMap.set(cleanedStep.id, mergedStep);
      } else {
        stepMap.set(cleanedStep.id, cleanedStep);
      }
    });
    return Array.from(stepMap.values());
  }

  private mergeTransitions(
    base: UnifiedFormSchema['transitions'],
    overrides: UnifiedFormSchema['transitions'],
  ): UnifiedFormSchema['transitions'] {
    const transitionMap = new Map<string, UnifiedFormSchema['transitions'][number]>();
    base.forEach((transition) => {
      const key = `${transition.from}->${transition.to}`;
      transitionMap.set(key, transition);
    });
    overrides.forEach((transition) => {
      const key = `${transition.from}->${transition.to}`;
      const path = `#/transitions/${key}`;
      const { directive, cleaned } = this.extractOverrideDirective(transition, path);
      const cleanedTransition = cleaned as UnifiedFormSchema['transitions'][number];
      const existing = transitionMap.get(key);
      if (existing) {
        const mergedTransition = this.deepMerge(
          existing as Record<string, any>,
          cleanedTransition as Record<string, any>,
          path,
          directive ?? null,
        ) as UnifiedFormSchema['transitions'][number];
        transitionMap.set(key, mergedTransition);
      } else {
        transitionMap.set(key, cleanedTransition);
      }
    });
    return Array.from(transitionMap.values());
  }

  private deepMerge<T extends Record<string, any>>(
    target: T,
    source: T,
    path = '#',
    inheritedDirective: OverrideDirective | null = null,
  ): T {
    const output: Record<string, any> = { ...target };

    if (!this.isPlainObject(source)) {
      return source;
    }

    const { directive, cleaned } = this.extractOverrideDirective(source, path);
    const effectiveDirective = directive ?? inheritedDirective;

    Object.keys(cleaned).forEach((key) => {
      const sourceValue = cleaned[key];
      const targetValue = (target as Record<string, any>)[key];
      const nextPath = `${path}/${key}`;

      if (Array.isArray(sourceValue)) {
        output[key] = Array.isArray(targetValue)
          ? [...targetValue, ...sourceValue]
          : [...sourceValue];
        return;
      }

      if (this.isPlainObject(sourceValue)) {
        const baseObject = this.isPlainObject(targetValue)
          ? (targetValue as Record<string, any>)
          : {};
        output[key] = this.deepMerge(
          baseObject,
          sourceValue as Record<string, any>,
          nextPath,
          effectiveDirective,
        );
        return;
      }

      if (
        typeof targetValue !== 'undefined' &&
        targetValue !== sourceValue &&
        !effectiveDirective &&
        !this.isOverrideExempt(nextPath)
      ) {
        throw new SchemaOverrideError(nextPath);
      }

      output[key] = sourceValue;
    });

    return output as T;
  }

  private extractOverrideDirective(
    value: unknown,
    path: string,
  ): { directive: OverrideDirective | null; cleaned: Record<string, any> } {
    if (!this.isPlainObject(value)) {
      return { directive: null, cleaned: value as Record<string, any> };
    }

    const { override, reason, ...rest } = value as Record<string, any>;

    if (typeof override === 'undefined' && typeof reason === 'undefined') {
      return { directive: null, cleaned: { ...value } };
    }

    if (override !== true) {
      throw new SchemaOverrideError(path, 'Set "override": true to confirm the override.');
    }

    if (typeof reason !== 'string' || reason.trim().length === 0) {
      throw new SchemaOverrideError(path, 'Provide a non-empty "reason" string.');
    }

    return { directive: { reason: reason.trim() }, cleaned: rest };
  }

  private isPlainObject(value: unknown): value is Record<string, any> {
    return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
  }

  private isOverrideExempt(path: string): boolean {
    return path === '#/$id' || path === '#/version';
  }
}
