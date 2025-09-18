import type { UnifiedFormSchema } from '../types';

export class SchemaComposer {
  private schemas: Map<string, UnifiedFormSchema> = new Map();

  constructor(initialSchemas?: UnifiedFormSchema[]) {
    initialSchemas?.forEach(schema => this.schemas.set(schema.$id, schema));
  }

  register(schema: UnifiedFormSchema): void {
    this.schemas.set(schema.$id, schema);
  }

  async loadSchema(id: string, loader: (id: string) => Promise<UnifiedFormSchema>): Promise<UnifiedFormSchema> {
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
      .map(id => {
        const base = this.schemas.get(id);
        if (!base) {
          throw new Error(`Schema ${id} has not been registered`);
        }
        return base;
      })
      .map(base => this.compose(base));

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

  private mergeWithOverrides(base: UnifiedFormSchema, overrides: UnifiedFormSchema): UnifiedFormSchema {
    const merged = this.deepMerge(base, overrides);
    merged.steps = this.mergeSteps(base.steps, overrides.steps);
    merged.transitions = this.mergeTransitions(base.transitions, overrides.transitions);
    return merged;
  }

  private mergeSteps(base: UnifiedFormSchema['steps'], overrides: UnifiedFormSchema['steps']): UnifiedFormSchema['steps'] {
    const stepMap = new Map(base.map(step => [step.id, step] as const));
    overrides.forEach(step => {
      const existing = stepMap.get(step.id);
      stepMap.set(step.id, existing ? { ...existing, ...step } : step);
    });
    return Array.from(stepMap.values());
  }

  private mergeTransitions(
    base: UnifiedFormSchema['transitions'],
    overrides: UnifiedFormSchema['transitions']
  ): UnifiedFormSchema['transitions'] {
    const transitionMap = new Map<string, UnifiedFormSchema['transitions'][number]>();
    base.forEach(transition => {
      const key = `${transition.from}->${transition.to}`;
      transitionMap.set(key, transition);
    });
    overrides.forEach(transition => {
      const key = `${transition.from}->${transition.to}`;
      const existing = transitionMap.get(key);
      transitionMap.set(key, existing ? { ...existing, ...transition } : transition);
    });
    return Array.from(transitionMap.values());
  }

  private deepMerge<T extends Record<string, any>>(target: T, source: T): T {
    const output: Record<string, any> = { ...target };

    Object.keys(source).forEach(key => {
      const sourceValue = source[key];
      const targetValue = (target as Record<string, any>)[key];

      if (Array.isArray(sourceValue)) {
        output[key] = Array.isArray(targetValue)
          ? [...targetValue, ...sourceValue]
          : [...sourceValue];
        return;
      }

      if (
        sourceValue &&
        typeof sourceValue === 'object' &&
        !Array.isArray(sourceValue)
      ) {
        output[key] = this.deepMerge(
          (targetValue as Record<string, any>) || {},
          sourceValue as Record<string, any>
        );
        return;
      }

      output[key] = sourceValue;
    });

    return output as T;
  }
}
