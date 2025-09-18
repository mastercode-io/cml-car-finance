export type Rule = ComparisonRule | LogicalRule | CustomRule | AlwaysRule;

export interface BaseRule {
  op: string;
}

export interface ComparisonRule extends BaseRule {
  op: 'eq' | 'neq' | 'gt' | 'lt' | 'gte' | 'lte' | 'in' | 'regex';
  left: string | unknown;
  right: unknown;
}

export interface LogicalRule extends BaseRule {
  op: 'and' | 'or' | 'not';
  args: Rule[];
}

export interface CustomRule extends BaseRule {
  op: 'custom';
  fn: string;
  args?: unknown[];
}

export interface AlwaysRule extends BaseRule {
  op: 'always';
  value?: boolean;
}

export interface RuleContext {
  userId?: string;
  stepId?: string;
  environment?: string;
  [key: string]: unknown;
}

export interface StepTransition {
  from: string;
  to: string;
  when?: Rule;
  default?: boolean;
  guard?: string;
}

export interface TransitionHistoryEntry {
  from: string;
  to: string;
  type: 'default' | 'conditional';
  timestamp: number;
}

export type TransitionGuard = (
  data: any,
  context?: TransitionContext,
) => boolean | Promise<boolean>;

export interface TransitionContext extends RuleContext {
  guards?: Record<string, TransitionGuard>;
  [key: string]: unknown;
}

export interface ComplexityAnalysis {
  uniqueConditions: number;
  maxNesting: number;
  hasAsyncGuards: boolean;
  hasParallelStates: boolean;
}

export const isLogicalRule = (rule: Rule): rule is LogicalRule =>
  rule.op === 'and' || rule.op === 'or' || rule.op === 'not';

export const isComparisonRule = (rule: Rule): rule is ComparisonRule =>
  (['eq', 'neq', 'gt', 'lt', 'gte', 'lte', 'in', 'regex'] as Array<ComparisonRule['op']>).includes(
    rule.op as ComparisonRule['op'],
  );

export const isCustomRule = (rule: Rule): rule is CustomRule => rule.op === 'custom';

export const isAlwaysRule = (rule: Rule): rule is AlwaysRule => rule.op === 'always';
