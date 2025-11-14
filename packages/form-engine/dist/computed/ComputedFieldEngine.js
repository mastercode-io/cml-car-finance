import { Parser } from 'expr-eval';
import * as jsonpath from 'jsonpath';
const JsonPath = jsonpath.JSONPath;
export class ComputedFieldEngine {
    dependencies = new Map();
    computedValues = new Map();
    expressions = new Map();
    customFunctions = {};
    parser;
    jsonPath = new JsonPath();
    userContext;
    constructor(parser = new Parser()) {
        this.parser = parser;
        this.registerBuiltInFunctions();
    }
    registerComputedField(field) {
        const targetPath = this.normalizePath(field.path);
        field.dependsOn.forEach((dep) => {
            const dependencyPath = this.normalizePath(dep);
            if (!this.dependencies.has(dependencyPath)) {
                this.dependencies.set(dependencyPath, new Set());
            }
            this.dependencies.get(dependencyPath).add(targetPath);
        });
        if (!this.expressions.has(targetPath)) {
            try {
                const expression = this.parser.parse(field.expr);
                this.expressions.set(targetPath, expression);
            }
            catch (error) {
                if (process.env.NODE_ENV !== 'test') {
                    console.error(`Failed to parse expression for ${field.path}:`, error);
                }
            }
        }
    }
    evaluate(field, data) {
        const targetPath = this.normalizePath(field.path);
        const dependencies = field.dependsOn.map((dep) => this.normalizePath(dep));
        const timestamp = Date.now();
        try {
            let expression = this.expressions.get(targetPath);
            if (!expression) {
                expression = this.parser.parse(field.expr);
                this.expressions.set(targetPath, expression);
            }
            const context = this.createContext(data, dependencies);
            const evaluated = expression.evaluate(context);
            const rounded = this.applyRounding(evaluated, field.round);
            if (field.cache !== false) {
                this.computedValues.set(targetPath, rounded);
            }
            this.setValueAtPath(data, targetPath, rounded);
            return {
                path: field.path,
                value: rounded,
                dependencies,
                timestamp,
            };
        }
        catch (error) {
            const fallbackValue = field.fallback ?? null;
            this.setValueAtPath(data, targetPath, fallbackValue);
            return {
                path: field.path,
                value: fallbackValue,
                error: error,
                dependencies,
                timestamp,
            };
        }
    }
    evaluateAll(fields, data) {
        if (!fields.length) {
            return [];
        }
        const sorted = this.topologicalSort(fields);
        return sorted.map((field) => this.evaluate(field, data));
    }
    getComputedValue(path) {
        return this.computedValues.get(this.normalizePath(path));
    }
    getAffectedFields(changedField) {
        const normalized = this.normalizePath(changedField);
        const affected = new Set();
        const queue = [normalized];
        while (queue.length) {
            const current = queue.pop();
            if (!current)
                continue;
            const dependents = this.dependencies.get(current);
            if (!dependents)
                continue;
            dependents.forEach((dep) => {
                if (!affected.has(dep)) {
                    affected.add(dep);
                    queue.push(dep);
                }
            });
        }
        return Array.from(affected.values());
    }
    registerCustomFunction(name, fn) {
        this.customFunctions[name] = fn;
    }
    setUserContext(user) {
        this.userContext = user;
    }
    clearCache() {
        this.computedValues.clear();
    }
    registerBuiltInFunctions() {
        const builtIns = {
            now: () => Date.now(),
            today: () => new Date().toISOString().split('T')[0],
            year: (date) => new Date(date).getFullYear(),
            month: (date) => new Date(date).getMonth() + 1,
            day: (date) => new Date(date).getDate(),
            floor: (value) => Math.floor(Number(value ?? 0)),
            ceil: (value) => Math.ceil(Number(value ?? 0)),
            round: (value) => Math.round(Number(value ?? 0)),
            abs: (value) => Math.abs(Number(value ?? 0)),
            concat: (...args) => args.join(''),
            upper: (value) => (typeof value === 'string' ? value.toUpperCase() : value),
            lower: (value) => (typeof value === 'string' ? value.toLowerCase() : value),
            trim: (value) => (typeof value === 'string' ? value.trim() : value),
            sum: (arr) => Array.isArray(arr) ? arr.reduce((acc, val) => acc + Number(val ?? 0), 0) : 0,
            avg: (arr) => {
                if (!Array.isArray(arr) || arr.length === 0) {
                    return 0;
                }
                const total = arr.reduce((acc, val) => acc + Number(val ?? 0), 0);
                return total / arr.length;
            },
            count: (arr) => (Array.isArray(arr) ? arr.length : 0),
        };
        Object.entries(builtIns).forEach(([key, fn]) => {
            this.customFunctions[key] = fn;
        });
    }
    createContext(data, dependencies) {
        const context = {
            ...this.customFunctions,
            data,
            now: this.customFunctions.now ?? (() => Date.now()),
            today: this.customFunctions.today ?? (() => new Date().toISOString().split('T')[0]),
        };
        if (this.userContext !== undefined) {
            context.user = this.userContext;
        }
        Object.assign(context, data);
        dependencies.forEach((dep) => {
            const cleanPath = this.stripPrefix(dep);
            if (!cleanPath) {
                return;
            }
            const value = this.safeGetValue(data, dep);
            this.assignContextValue(context, cleanPath, value);
        });
        context.custom = this.customFunctions;
        return context;
    }
    assignContextValue(context, path, value) {
        const segments = this.parsePathSegments(path);
        if (!segments.length) {
            return;
        }
        let current = context;
        segments.forEach((segment, index) => {
            const isLast = index === segments.length - 1;
            if (isLast) {
                current[segment] = value;
                return;
            }
            if (current[segment] === undefined) {
                current[segment] = typeof segments[index + 1] === 'number' ? [] : {};
            }
            current = current[segment];
        });
    }
    parsePathSegments(path) {
        const cleaned = path.replace(/\['([^']+)'\]/g, '.$1');
        const tokens = cleaned.match(/[^.\[\]]+/g);
        if (!tokens) {
            return [];
        }
        return tokens.map((token) => {
            const numeric = Number(token);
            return Number.isInteger(numeric) && token === numeric.toString() ? numeric : token;
        });
    }
    safeGetValue(data, path) {
        try {
            return this.jsonPath.value(data, path);
        }
        catch (error) {
            if (process.env.NODE_ENV !== 'test') {
                console.warn(`Failed to resolve JSONPath ${path}`, error);
            }
            return undefined;
        }
    }
    setValueAtPath(data, path, value) {
        try {
            this.jsonPath.value(data, path, value);
        }
        catch (error) {
            if (process.env.NODE_ENV !== 'test') {
                console.warn(`Failed to set value at path ${path}`, error);
            }
            const cleanPath = this.stripPrefix(path);
            if (!cleanPath)
                return;
            this.assignContextValue(data, cleanPath, value);
        }
    }
    topologicalSort(fields) {
        const visited = new Set();
        const visiting = new Set();
        const sorted = [];
        const fieldMap = new Map();
        fields.forEach((field) => {
            fieldMap.set(this.normalizePath(field.path), field);
        });
        const visit = (field) => {
            const fieldPath = this.normalizePath(field.path);
            if (visited.has(fieldPath)) {
                return;
            }
            if (visiting.has(fieldPath)) {
                throw new Error(`Circular dependency detected: ${field.path}`);
            }
            visiting.add(fieldPath);
            field.dependsOn.forEach((dep) => {
                const dependencyField = fieldMap.get(this.normalizePath(dep));
                if (dependencyField) {
                    visit(dependencyField);
                }
            });
            visiting.delete(fieldPath);
            visited.add(fieldPath);
            sorted.push(field);
        };
        fields.forEach(visit);
        return sorted;
    }
    normalizePath(path) {
        if (!path) {
            return path;
        }
        if (path.startsWith('$.') || path.startsWith('$[')) {
            return path;
        }
        if (path === '$') {
            return '$';
        }
        return `$.${path}`;
    }
    stripPrefix(path) {
        return path.startsWith('$.')
            ? path.substring(2)
            : path.replace(/^\$\['?/, '').replace(/'?]$/, '');
    }
    applyRounding(value, decimals) {
        if (typeof value !== 'number' || decimals === undefined) {
            return value;
        }
        const factor = Math.pow(10, decimals);
        return Math.round(value * factor) / factor;
    }
}
//# sourceMappingURL=ComputedFieldEngine.js.map