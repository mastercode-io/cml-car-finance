const buildFieldPath = (field) => (field.startsWith('$.') ? field : `$.${field}`);
export class RuleBuilder {
    static equals(field, value) {
        return { op: 'eq', left: buildFieldPath(field), right: value };
    }
    static notEquals(field, value) {
        return { op: 'neq', left: buildFieldPath(field), right: value };
    }
    static greaterThan(field, value) {
        return { op: 'gt', left: buildFieldPath(field), right: value };
    }
    static greaterThanOrEqual(field, value) {
        return { op: 'gte', left: buildFieldPath(field), right: value };
    }
    static lessThan(field, value) {
        return { op: 'lt', left: buildFieldPath(field), right: value };
    }
    static lessThanOrEqual(field, value) {
        return { op: 'lte', left: buildFieldPath(field), right: value };
    }
    static in(field, values) {
        return { op: 'in', left: buildFieldPath(field), right: values };
    }
    static matches(field, pattern) {
        return { op: 'regex', left: buildFieldPath(field), right: pattern };
    }
    static and(...rules) {
        return { op: 'and', args: rules };
    }
    static or(...rules) {
        return { op: 'or', args: rules };
    }
    static not(rule) {
        return { op: 'not', args: [rule] };
    }
    static custom(functionName, ...args) {
        return { op: 'custom', fn: functionName, args };
    }
    static required(field) {
        return this.notEquals(field, null);
    }
    static optional(field) {
        return this.not(this.required(field));
    }
}
//# sourceMappingURL=rule-builder.js.map