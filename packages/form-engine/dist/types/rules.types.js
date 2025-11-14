export const isLogicalRule = (rule) => rule.op === 'and' || rule.op === 'or' || rule.op === 'not';
export const isComparisonRule = (rule) => ['eq', 'neq', 'gt', 'lt', 'gte', 'lte', 'in', 'regex'].includes(rule.op);
export const isCustomRule = (rule) => rule.op === 'custom';
export const isAlwaysRule = (rule) => rule.op === 'always';
//# sourceMappingURL=rules.types.js.map