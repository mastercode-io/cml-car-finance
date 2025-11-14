export class PathGenerator {
    paths = [];
    visited = new Set();
    random = Math.random;
    generatePaths(schema, options = {}) {
        this.reset();
        if (!schema.steps.length) {
            return [];
        }
        const config = {
            maxPaths: options.maxPaths ?? 10,
            maxDepth: options.maxDepth ?? 20,
            coverage: options.coverage ?? 'representative',
            includeInvalid: options.includeInvalid !== false,
            seed: options.seed,
        };
        this.random = this.createRng(config.seed);
        switch (config.coverage) {
            case 'minimal':
                this.generatePath(schema, 'path-0', { strategy: 'default' });
                break;
            case 'exhaustive':
                this.explorePaths(schema, schema.steps[0].id, [], {}, {}, 0, config.maxDepth);
                this.generateBoundaryPaths(schema);
                break;
            case 'representative':
            default:
                this.explorePaths(schema, schema.steps[0].id, [], {}, {}, 0, config.maxDepth);
                break;
        }
        if (config.includeInvalid) {
            this.generateErrorPaths(schema);
        }
        return this.prunePaths(config.maxPaths);
    }
    explorePaths(schema, currentStep, path, data, conditions, depth, maxDepth) {
        if (depth > maxDepth) {
            return;
        }
        const pathKey = `${currentStep}|${path.join('>')}`;
        if (this.visited.has(pathKey)) {
            return;
        }
        this.visited.add(pathKey);
        const newPath = [...path, currentStep];
        const step = schema.steps.find((item) => item.id === currentStep);
        const mergedData = { ...data, ...this.generateStepData(step, 'default') };
        const transitions = schema.transitions.filter((transition) => transition.from === currentStep);
        if (transitions.length === 0) {
            this.paths.push({
                id: `path-${this.paths.length}`,
                steps: newPath,
                conditions: { ...conditions },
                data: mergedData,
                expectedOutcome: 'success',
            });
            return;
        }
        transitions.forEach((transition) => {
            const branchConditions = { ...conditions };
            let branchData = { ...mergedData };
            if (transition.when) {
                const satisfyingData = this.generateDataForCondition(transition.when, schema);
                branchData = { ...branchData, ...satisfyingData };
                branchConditions[transition.to] = transition.when;
            }
            this.explorePaths(schema, transition.to, newPath, branchData, branchConditions, depth + 1, maxDepth);
        });
    }
    generatePath(schema, id, options) {
        if (!schema.steps.length) {
            return;
        }
        const path = {
            id,
            steps: [],
            conditions: {},
            data: {},
            expectedOutcome: 'success',
        };
        let currentStep = schema.steps[0];
        while (currentStep) {
            path.steps.push(currentStep.id);
            const stepData = this.generateStepData(currentStep, options.strategy);
            path.data = { ...path.data, ...stepData };
            const transitions = schema.transitions.filter((transition) => transition.from === currentStep?.id);
            if (transitions.length === 0) {
                break;
            }
            const transition = this.selectTransition(transitions);
            if (!transition) {
                break;
            }
            if (transition.when) {
                path.conditions[transition.to] = transition.when;
                path.data = {
                    ...path.data,
                    ...this.generateDataForCondition(transition.when, schema),
                };
            }
            currentStep = schema.steps.find((step) => step.id === transition.to);
        }
        this.paths.push(path);
    }
    generateStepData(step, strategy) {
        if (!step || typeof step.schema !== 'object') {
            return {};
        }
        const data = {};
        const properties = step.schema.properties ?? {};
        Object.entries(properties).forEach(([key, definition]) => {
            data[key] = this.generateFieldValue(definition, strategy);
        });
        return data;
    }
    generateFieldValue(schema, strategy) {
        const type = schema?.type;
        if (Array.isArray(type)) {
            return this.generateFieldValue({ ...schema, type: type[0] }, strategy);
        }
        switch (type) {
            case 'number':
                if (strategy === 'boundary' && typeof schema.minimum === 'number') {
                    return schema.minimum;
                }
                return schema.minimum ?? 1;
            case 'boolean':
                return true;
            case 'array':
                return [];
            case 'string':
            default:
                if (schema.enum && schema.enum.length > 0) {
                    return schema.enum[0];
                }
                if (schema.format === 'email') {
                    return 'test@example.com';
                }
                if (schema.format === 'date') {
                    return '2024-01-01';
                }
                return 'sample value';
        }
    }
    generateDataForCondition(condition, schema) {
        const data = {};
        if (condition.op === 'eq' && typeof condition.left === 'string') {
            const field = condition.left.replace('$.', '');
            data[field] = condition.right;
        }
        if (condition.op === 'and' || condition.op === 'or') {
            const args = condition.args ?? [];
            args.forEach((arg) => Object.assign(data, this.generateDataForCondition(arg, schema)));
        }
        return data;
    }
    selectTransition(transitions) {
        if (transitions.length === 0) {
            return null;
        }
        const defaultTransition = transitions.find((transition) => transition.default);
        if (defaultTransition) {
            return defaultTransition;
        }
        const index = Math.floor(this.random() * transitions.length);
        return transitions[index] ?? null;
    }
    generateBoundaryPaths(schema) {
        schema.steps.forEach((step, index) => {
            const id = `boundary-${index}`;
            this.generatePath(schema, id, { strategy: 'boundary' });
        });
    }
    generateErrorPaths(schema) {
        schema.steps.forEach((step) => {
            if (!step.schema || typeof step.schema !== 'object') {
                return;
            }
            const required = step.schema.required ?? [];
            if (!Array.isArray(required) || required.length === 0) {
                return;
            }
            const invalidData = {};
            required.forEach((field) => {
                invalidData[field] = undefined;
            });
            this.paths.push({
                id: `invalid-${step.id}-${this.paths.length}`,
                steps: [step.id],
                conditions: {},
                data: invalidData,
                expectedOutcome: 'validation_error',
            });
        });
    }
    prunePaths(maxPaths) {
        if (this.paths.length <= maxPaths) {
            return this.paths;
        }
        return this.paths.slice(0, maxPaths);
    }
    createRng(seed) {
        if (typeof seed !== 'number') {
            return Math.random;
        }
        let state = seed % 2147483647;
        if (state <= 0) {
            state += 2147483646;
        }
        return () => {
            state = (state * 16807) % 2147483647;
            return (state - 1) / 2147483646;
        };
    }
    reset() {
        this.paths = [];
        this.visited = new Set();
        this.random = Math.random;
    }
}
//# sourceMappingURL=PathGenerator.js.map