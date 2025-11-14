class SchemaOverrideError extends Error {
    constructor(path, detail) {
        const suffix = detail ? detail : 'Add { "override": true, "reason": "..." } to continue.';
        super(`Override guard failed at "${path}". ${suffix}`);
        this.name = 'SchemaOverrideError';
    }
}
export class SchemaComposer {
    schemas = new Map();
    constructor(initialSchemas) {
        initialSchemas?.forEach((schema) => this.schemas.set(schema.$id, schema));
    }
    register(schema) {
        this.schemas.set(schema.$id, schema);
    }
    async loadSchema(id, loader) {
        if (this.schemas.has(id)) {
            return this.schemas.get(id);
        }
        const schema = await loader(id);
        this.schemas.set(id, schema);
        return schema;
    }
    compose(schema) {
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
        const mergedBase = baseSchemas.reduce((acc, current) => {
            if (!acc)
                return current;
            return this.mergeSchemas(acc, current);
        }, null);
        return mergedBase ? this.mergeWithOverrides(mergedBase, schema) : schema;
    }
    mergeSchemas(target, source) {
        const merged = this.deepMerge(target, source);
        merged.steps = this.mergeSteps(target.steps, source.steps);
        merged.transitions = this.mergeTransitions(target.transitions, source.transitions);
        return merged;
    }
    mergeWithOverrides(base, overrides) {
        const merged = this.deepMerge(base, overrides);
        merged.steps = this.mergeSteps(base.steps, overrides.steps);
        merged.transitions = this.mergeTransitions(base.transitions, overrides.transitions);
        return merged;
    }
    mergeSteps(base, overrides) {
        const stepMap = new Map(base.map((step) => [step.id, step]));
        overrides.forEach((step) => {
            const path = `#/steps/${step.id}`;
            const { directive, cleaned } = this.extractOverrideDirective(step, path);
            const cleanedStep = cleaned;
            const existing = stepMap.get(cleanedStep.id);
            if (existing) {
                const mergedStep = this.deepMerge(existing, cleanedStep, path, directive ?? null);
                stepMap.set(cleanedStep.id, mergedStep);
            }
            else {
                stepMap.set(cleanedStep.id, cleanedStep);
            }
        });
        return Array.from(stepMap.values());
    }
    mergeTransitions(base, overrides) {
        const transitionMap = new Map();
        base.forEach((transition) => {
            const key = `${transition.from}->${transition.to}`;
            transitionMap.set(key, transition);
        });
        overrides.forEach((transition) => {
            const key = `${transition.from}->${transition.to}`;
            const path = `#/transitions/${key}`;
            const { directive, cleaned } = this.extractOverrideDirective(transition, path);
            const cleanedTransition = cleaned;
            const existing = transitionMap.get(key);
            if (existing) {
                const mergedTransition = this.deepMerge(existing, cleanedTransition, path, directive ?? null);
                transitionMap.set(key, mergedTransition);
            }
            else {
                transitionMap.set(key, cleanedTransition);
            }
        });
        return Array.from(transitionMap.values());
    }
    deepMerge(target, source, path = '#', inheritedDirective = null) {
        const output = { ...target };
        if (!this.isPlainObject(source)) {
            return source;
        }
        const { directive, cleaned } = this.extractOverrideDirective(source, path);
        const effectiveDirective = directive ?? inheritedDirective;
        Object.keys(cleaned).forEach((key) => {
            const sourceValue = cleaned[key];
            const targetValue = target[key];
            const nextPath = `${path}/${key}`;
            if (Array.isArray(sourceValue)) {
                output[key] = Array.isArray(targetValue)
                    ? [...targetValue, ...sourceValue]
                    : [...sourceValue];
                return;
            }
            if (this.isPlainObject(sourceValue)) {
                const baseObject = this.isPlainObject(targetValue)
                    ? targetValue
                    : {};
                output[key] = this.deepMerge(baseObject, sourceValue, nextPath, effectiveDirective);
                return;
            }
            if (typeof targetValue !== 'undefined' &&
                targetValue !== sourceValue &&
                !effectiveDirective &&
                !this.isOverrideExempt(nextPath)) {
                throw new SchemaOverrideError(nextPath);
            }
            output[key] = sourceValue;
        });
        return output;
    }
    extractOverrideDirective(value, path) {
        if (!this.isPlainObject(value)) {
            return { directive: null, cleaned: value };
        }
        const { override, reason, ...rest } = value;
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
    isPlainObject(value) {
        return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
    }
    isOverrideExempt(path) {
        return path === '#/$id' || path === '#/version';
    }
}
//# sourceMappingURL=schema-composer.js.map