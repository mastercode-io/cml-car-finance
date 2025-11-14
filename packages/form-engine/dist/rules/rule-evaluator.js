import JSONPath from 'jsonpath';
export class RuleEvaluator {
    customFunctions = new Map();
    cache = new Map();
    evaluationCount = 0;
    maxEvaluations = 1000;
    evaluate(rule, data, context) {
        if (!rule) {
            return true;
        }
        this.evaluationCount += 1;
        if (this.evaluationCount > this.maxEvaluations) {
            throw new Error('Maximum rule evaluations exceeded');
        }
        const cacheKey = this.getCacheKey(rule, data, context);
        if (this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey);
        }
        const result = this.evaluateRule(rule, data, context);
        this.cache.set(cacheKey, result);
        return result;
    }
    clearCache() {
        this.cache.clear();
        this.evaluationCount = 0;
    }
    registerCustomFunction(name, fn) {
        this.customFunctions.set(name, fn);
    }
    evaluateRule(rule, data, context) {
        switch (rule.op) {
            case 'always':
                return 'value' in rule ? Boolean(rule.value) : true;
            case 'eq':
                return this.evaluateComparison(rule, data, (a, b) => a === b, context);
            case 'neq':
                return this.evaluateComparison(rule, data, (a, b) => a !== b, context);
            case 'gt':
                return this.evaluateComparison(rule, data, (a, b) => a > b, context);
            case 'lt':
                return this.evaluateComparison(rule, data, (a, b) => a < b, context);
            case 'gte':
                return this.evaluateComparison(rule, data, (a, b) => a >= b, context);
            case 'lte':
                return this.evaluateComparison(rule, data, (a, b) => a <= b, context);
            case 'in':
                return this.evaluateIn(rule, data, context);
            case 'regex':
                return this.evaluateRegex(rule, data, context);
            case 'and':
                return rule.args.every((child) => this.evaluate(child, data, context));
            case 'or':
                return rule.args.some((child) => this.evaluate(child, data, context));
            case 'not':
                return !rule.args.length
                    ? true
                    : !this.evaluate(rule.args[0], data, context);
            case 'custom':
                return this.evaluateCustom(rule, data, context);
            default:
                throw new Error(`Unknown rule operator: ${rule.op}`);
        }
    }
    evaluateComparison(rule, data, compare, context) {
        const leftValue = this.resolveValue(rule.left, data, context);
        const rightValue = this.resolveValue(rule.right, data, context);
        if (leftValue === undefined || leftValue === null) {
            return false;
        }
        const coerced = this.coerceTypes(leftValue, rightValue);
        return compare(coerced.left, coerced.right);
    }
    evaluateIn(rule, data, context) {
        const leftValue = this.resolveValue(rule.left, data, context);
        const rightValue = this.resolveValue(rule.right, data, context);
        if (!Array.isArray(rightValue)) {
            throw new Error('Right side of "in" operator must be an array');
        }
        return rightValue.includes(leftValue);
    }
    evaluateRegex(rule, data, context) {
        const leftValue = this.resolveValue(rule.left, data, context);
        const pattern = this.resolveValue(rule.right, data, context);
        if (typeof leftValue !== 'string') {
            return false;
        }
        const regex = typeof pattern === 'string' ? new RegExp(pattern) : pattern;
        return regex.test(leftValue);
    }
    evaluateCustom(rule, data, context) {
        const fn = this.customFunctions.get(rule.fn);
        if (!fn) {
            throw new Error(`Unknown custom function: ${rule.fn}`);
        }
        return fn(data, rule.args, context);
    }
    resolveValue(path, data, context) {
        if (typeof path !== 'string') {
            return path;
        }
        if (path.startsWith('$')) {
            const results = JSONPath.query(data, path);
            if (results.length === 0) {
                return undefined;
            }
            return results.length === 1 ? results[0] : results;
        }
        if (path.startsWith('@')) {
            return this.resolveContextValue(path, context);
        }
        return path;
    }
    resolveContextValue(path, context) {
        if (context && path in context) {
            return context[path];
        }
        const contextValues = {
            '@now': new Date(),
            '@today': new Date().toISOString().split('T')[0],
            '@env': typeof process !== 'undefined' ? process.env.NODE_ENV : 'production',
        };
        return contextValues[path];
    }
    coerceTypes(left, right) {
        if (left instanceof Date || right instanceof Date) {
            return {
                left: left instanceof Date ? left : new Date(left),
                right: right instanceof Date ? right : new Date(right),
            };
        }
        const bothNumeric = (typeof left === 'number' || typeof right === 'number') &&
            !Number.isNaN(Number(left)) &&
            !Number.isNaN(Number(right));
        if (bothNumeric) {
            return {
                left: Number(left),
                right: Number(right),
            };
        }
        return {
            left: typeof left === 'string' ? left : String(left),
            right: typeof right === 'string' ? right : String(right),
        };
    }
    getCacheKey(rule, data, context) {
        return `${JSON.stringify(rule)}::${JSON.stringify(data)}::${JSON.stringify(context ?? {})}`;
    }
}
const sharedEvaluator = new RuleEvaluator();
export const evaluateRule = (rule, data, context) => sharedEvaluator.evaluate(rule, data, context);
//# sourceMappingURL=rule-evaluator.js.map