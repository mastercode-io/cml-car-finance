# Step 5: Rule Engine & Branching Logic

## Step Description
Implement the rule DSL evaluation system for visibility conditions and step transitions, build the branching logic engine, and establish integration hooks for XState when complexity thresholds are exceeded.

## Prerequisites
- Step 4 (Validation Engine) completed
- Rule type definitions available
- JSONPath library installed
- XState and @xstate/react installed
- Understanding of the rule DSL specification

## Detailed To-Do List

### 5.1 Rule Evaluator Core
```typescript
// src/rules/rule-evaluator.ts

import JSONPath from 'jsonpath';

export class RuleEvaluator {
  private customFunctions: Map<string, Function> = new Map();
  private cache: Map<string, any> = new Map();
  private evaluationCount = 0;
  private maxEvaluations = 1000; // Prevent infinite loops
  
  evaluate(rule: Rule, data: any, context?: RuleContext): boolean {
    this.evaluationCount++;
    
    if (this.evaluationCount > this.maxEvaluations) {
      throw new Error('Maximum rule evaluations exceeded');
    }
    
    // Check cache
    const cacheKey = this.getCacheKey(rule, data);
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }
    
    const result = this.evaluateRule(rule, data, context);
    this.cache.set(cacheKey, result);
    
    return result;
  }
  
  private evaluateRule(rule: Rule, data: any, context?: RuleContext): boolean {
    switch (rule.op) {
      // Comparison operators
      case 'eq':
        return this.evaluateComparison(rule, data, (a, b) => a === b);
      case 'neq':
        return this.evaluateComparison(rule, data, (a, b) => a !== b);
      case 'gt':
        return this.evaluateComparison(rule, data, (a, b) => a > b);
      case 'lt':
        return this.evaluateComparison(rule, data, (a, b) => a < b);
      case 'gte':
        return this.evaluateComparison(rule, data, (a, b) => a >= b);
      case 'lte':
        return this.evaluateComparison(rule, data, (a, b) => a <= b);
      case 'in':
        return this.evaluateIn(rule, data);
      case 'regex':
        return this.evaluateRegex(rule, data);
        
      // Logical operators
      case 'and':
        return rule.args.every(r => this.evaluate(r, data, context));
      case 'or':
        return rule.args.some(r => this.evaluate(r, data, context));
      case 'not':
        return !this.evaluate(rule.args[0], data, context);
        
      // Custom function
      case 'custom':
        return this.evaluateCustom(rule, data, context);
        
      default:
        throw new Error(`Unknown rule operator: ${(rule as any).op}`);
    }
  }
  
  private evaluateComparison(
    rule: ComparisonRule,
    data: any,
    compareFn: (a: any, b: any) => boolean
  ): boolean {
    const leftValue = this.resolveValue(rule.left, data);
    const rightValue = this.resolveValue(rule.right, data);
    
    // Handle null/undefined
    if (leftValue === undefined || leftValue === null) {
      return false;
    }
    
    // Type coercion for comparison
    const coerced = this.coerceTypes(leftValue, rightValue);
    
    return compareFn(coerced.left, coerced.right);
  }
  
  private evaluateIn(rule: ComparisonRule, data: any): boolean {
    const leftValue = this.resolveValue(rule.left, data);
    const rightValue = this.resolveValue(rule.right, data);
    
    if (!Array.isArray(rightValue)) {
      throw new Error('Right side of "in" operator must be an array');
    }
    
    return rightValue.includes(leftValue);
  }
  
  private evaluateRegex(rule: ComparisonRule, data: any): boolean {
    const leftValue = this.resolveValue(rule.left, data);
    const pattern = this.resolveValue(rule.right, data);
    
    if (typeof leftValue !== 'string') {
      return false;
    }
    
    const regex = typeof pattern === 'string' 
      ? new RegExp(pattern)
      : pattern;
      
    return regex.test(leftValue);
  }
  
  private evaluateCustom(
    rule: CustomRule,
    data: any,
    context?: RuleContext
  ): boolean {
    const fn = this.customFunctions.get(rule.fn);
    
    if (!fn) {
      throw new Error(`Unknown custom function: ${rule.fn}`);
    }
    
    return fn(data, rule.args, context);
  }
  
  private resolveValue(path: string | any, data: any): any {
    // If not a string, return as is (literal value)
    if (typeof path !== 'string') {
      return path;
    }
    
    // Check if it's a JSONPath expression
    if (path.startsWith('$')) {
      const results = JSONPath.query(data, path);
      return results.length === 1 ? results[0] : results;
    }
    
    // Check if it's a context reference
    if (path.startsWith('@')) {
      return this.resolveContextValue(path);
    }
    
    // Treat as literal string
    return path;
  }
  
  private resolveContextValue(path: string): any {
    // Context values like @now, @user, @env
    const contextValues: Record<string, any> = {
      '@now': new Date(),
      '@today': new Date().toISOString().split('T')[0],
      '@user': globalThis.currentUser,
      '@env': process.env.NODE_ENV
    };
    
    return contextValues[path] || path;
  }
  
  private coerceTypes(left: any, right: any): { left: any; right: any } {
    // Number comparison
    if (typeof left === 'number' || typeof right === 'number') {
      return {
        left: Number(left),
        right: Number(right)
      };
    }
    
    // Date comparison
    if (left instanceof Date || right instanceof Date) {
      return {
        left: new Date(left),
        right: new Date(right)
      };
    }
    
    // String comparison
    return {
      left: String(left),
      right: String(right)
    };
  }
  
  private getCacheKey(rule: Rule, data: any): string {
    return `${JSON.stringify(rule)}_${JSON.stringify(data)}`;
  }
  
  registerCustomFunction(name: string, fn: Function): void {
    this.customFunctions.set(name, fn);
  }
  
  clearCache(): void {
    this.cache.clear();
    this.evaluationCount = 0;
  }
}
```

### 5.2 Visibility Controller
```typescript
// src/rules/visibility-controller.ts

export class VisibilityController {
  private evaluator: RuleEvaluator;
  private visibilityCache: Map<string, boolean> = new Map();
  
  constructor(evaluator?: RuleEvaluator) {
    this.evaluator = evaluator || new RuleEvaluator();
    this.registerDefaultFunctions();
  }
  
  private registerDefaultFunctions(): void {
    // Register common visibility functions
    this.evaluator.registerCustomFunction('isWeekday', (data) => {
      const day = new Date().getDay();
      return day >= 1 && day <= 5;
    });
    
    this.evaluator.registerCustomFunction('hasRole', (data, args) => {
      const userRoles = data.user?.roles || [];
      const requiredRole = args[0];
      return userRoles.includes(requiredRole);
    });
    
    this.evaluator.registerCustomFunction('isComplete', (data, args) => {
      const stepId = args[0];
      return data._meta?.completedSteps?.includes(stepId) || false;
    });
  }
  
  isVisible(
    elementId: string,
    rule: Rule | undefined,
    data: any
  ): boolean {
    // No rule means always visible
    if (!rule) return true;
    
    // Check cache
    const cacheKey = `${elementId}_${JSON.stringify(data)}`;
    if (this.visibilityCache.has(cacheKey)) {
      return this.visibilityCache.get(cacheKey)!;
    }
    
    try {
      const result = this.evaluator.evaluate(rule, data);
      this.visibilityCache.set(cacheKey, result);
      return result;
    } catch (error) {
      console.error(`Error evaluating visibility for ${elementId}:`, error);
      return true; // Default to visible on error
    }
  }
  
  getVisibleFields(
    schema: UnifiedFormSchema,
    stepId: string,
    data: any
  ): string[] {
    const step = schema.steps.find(s => s.id === stepId);
    if (!step) return [];
    
    const visibleFields: string[] = [];
    const stepSchema = this.resolveSchema(step.schema, schema);
    
    if (stepSchema.properties) {
      for (const [fieldName, fieldSchema] of Object.entries(stepSchema.properties)) {
        const visibilityRule = (fieldSchema as any)['x-visibility'];
        
        if (this.isVisible(fieldName, visibilityRule, data)) {
          visibleFields.push(fieldName);
        }
      }
    }
    
    return visibleFields;
  }
  
  getVisibleSteps(
    schema: UnifiedFormSchema,
    data: any
  ): string[] {
    return schema.steps
      .filter(step => this.isVisible(step.id, step.visibleWhen, data))
      .map(step => step.id);
  }
  
  private resolveSchema(
    schema: JSONSchema | { $ref: string },
    parentSchema: UnifiedFormSchema
  ): JSONSchema {
    if ('$ref' in schema) {
      const refPath = schema.$ref.replace('#/', '');
      const parts = refPath.split('/');
      
      let resolved: any = parentSchema;
      for (const part of parts) {
        resolved = resolved[part];
      }
      
      return resolved as JSONSchema;
    }
    
    return schema;
  }
  
  clearCache(): void {
    this.visibilityCache.clear();
    this.evaluator.clearCache();
  }
}
```

### 5.3 Step Transition Engine
```typescript
// src/rules/transition-engine.ts

export class TransitionEngine {
  private evaluator: RuleEvaluator;
  private transitionHistory: TransitionHistoryEntry[] = [];
  
  constructor(evaluator?: RuleEvaluator) {
    this.evaluator = evaluator || new RuleEvaluator();
  }
  
  getNextStep(
    schema: UnifiedFormSchema,
    currentStep: string,
    data: any,
    context?: TransitionContext
  ): string | null {
    // Find all transitions from current step
    const transitions = schema.transitions.filter(t => t.from === currentStep);
    
    if (transitions.length === 0) {
      return this.getDefaultNextStep(schema, currentStep);
    }
    
    // Sort transitions: non-default first, then by order
    const sorted = transitions.sort((a, b) => {
      if (a.default && !b.default) return 1;
      if (!a.default && b.default) return -1;
      return 0;
    });
    
    // Evaluate conditions in order
    for (const transition of sorted) {
      if (transition.default) {
        // Default transition always matches
        this.recordTransition(currentStep, transition.to, 'default');
        return transition.to;
      }
      
      if (transition.when && this.evaluator.evaluate(transition.when, data)) {
        // Check guard if using XState
        if (transition.guard && context?.guards) {
          const guardFn = context.guards[transition.guard];
          if (guardFn && !guardFn(data, context)) {
            continue;
          }
        }
        
        this.recordTransition(currentStep, transition.to, 'conditional');
        return transition.to;
      }
    }
    
    // No matching transition
    return null;
  }
  
  getPreviousStep(
    schema: UnifiedFormSchema,
    currentStep: string,
    data: any
  ): string | null {
    const visibleSteps = this.getAllVisibleSteps(schema, data);
    const currentIndex = visibleSteps.indexOf(currentStep);
    
    if (currentIndex > 0) {
      return visibleSteps[currentIndex - 1];
    }
    
    return null;
  }
  
  private getAllVisibleSteps(
    schema: UnifiedFormSchema,
    data: any
  ): string[] {
    const visibilityController = new VisibilityController(this.evaluator);
    return visibilityController.getVisibleSteps(schema, data);
  }
  
  private getDefaultNextStep(
    schema: UnifiedFormSchema,
    currentStep: string
  ): string | null {
    const steps = schema.steps;
    const currentIndex = steps.findIndex(s => s.id === currentStep);
    
    if (currentIndex < steps.length - 1) {
      return steps[currentIndex + 1].id;
    }
    
    return null;
  }
  
  canTransition(
    schema: UnifiedFormSchema,
    from: string,
    to: string,
    data: any
  ): boolean {
    const nextStep = this.getNextStep(schema, from, data);
    return nextStep === to;
  }
  
  getTransitionPath(
    schema: UnifiedFormSchema,
    startStep: string,
    endStep: string,
    data: any,
    maxSteps: number = 20
  ): string[] {
    const path: string[] = [startStep];
    let currentStep = startStep;
    let steps = 0;
    
    while (currentStep !== endStep && steps < maxSteps) {
      const nextStep = this.getNextStep(schema, currentStep, data);
      
      if (!nextStep) {
        return []; // No path found
      }
      
      path.push(nextStep);
      currentStep = nextStep;
      steps++;
    }
    
    if (currentStep !== endStep) {
      return []; // Path too long or cycle detected
    }
    
    return path;
  }
  
  private recordTransition(
    from: string,
    to: string,
    type: 'default' | 'conditional'
  ): void {
    this.transitionHistory.push({
      from,
      to,
      type,
      timestamp: Date.now()
    });
    
    // Keep only last 100 transitions
    if (this.transitionHistory.length > 100) {
      this.transitionHistory.shift();
    }
  }
  
  getTransitionHistory(): TransitionHistoryEntry[] {
    return [...this.transitionHistory];
  }
}
```

### 5.4 XState Integration
```typescript
// src/rules/xstate-adapter.ts

import { createMachine, interpret, State } from 'xstate';
import { createModel } from 'xstate/lib/model';

export class XStateAdapter {
  private complexityThreshold = {
    maxConditions: 8,
    maxNesting: 3,
    requiresAsync: false,
    requiresParallel: false,
    requiresAudit: false
  };
  
  shouldUseXState(schema: UnifiedFormSchema): boolean {
    const analysis = this.analyzeComplexity(schema);
    
    return (
      analysis.uniqueConditions > this.complexityThreshold.maxConditions ||
      analysis.maxNesting > this.complexityThreshold.maxNesting ||
      analysis.hasAsyncGuards ||
      analysis.hasParallelStates ||
      schema.metadata.requiresAudit === true
    );
  }
  
  private analyzeComplexity(schema: UnifiedFormSchema): ComplexityAnalysis {
    let uniqueConditions = 0;
    let maxNesting = 0;
    let hasAsyncGuards = false;
    let hasParallelStates = false;
    
    // Count unique conditions in transitions
    const conditions = new Set<string>();
    
    for (const transition of schema.transitions) {
      if (transition.when) {
        conditions.add(JSON.stringify(transition.when));
        maxNesting = Math.max(maxNesting, this.getMaxNesting(transition.when));
      }
      
      if (transition.guard?.includes('async')) {
        hasAsyncGuards = true;
      }
    }
    
    uniqueConditions = conditions.size;
    
    // Check for parallel states (multiple active steps)
    hasParallelStates = schema.steps.some(s => 
      (s as any).parallel === true
    );
    
    return {
      uniqueConditions,
      maxNesting,
      hasAsyncGuards,
      hasParallelStates
    };
  }
  
  private getMaxNesting(rule: Rule, depth: number = 0): number {
    if (rule.op === 'and' || rule.op === 'or' || rule.op === 'not') {
      const childDepths = rule.args.map(r => 
        this.getMaxNesting(r, depth + 1)
      );
      return Math.max(...childDepths);
    }
    
    return depth;
  }
  
  convertToStateMachine(schema: UnifiedFormSchema): any {
    const model = createModel(
      {
        formData: {} as any,
        currentStep: schema.steps[0]?.id || '',
        completedSteps: [] as string[],
        errors: {} as Record<string, any>
      },
      {
        events: {
          NEXT: () => ({}),
          PREVIOUS: () => ({}),
          UPDATE_FIELD: (field: string, value: any) => ({ field, value }),
          VALIDATE: () => ({}),
          SUBMIT: () => ({})
        }
      }
    );
    
    // Build state configuration
    const states: Record<string, any> = {};
    
    for (const step of schema.steps) {
      states[step.id] = {
        entry: ['validateStep', 'saveProgress'],
        on: {
          NEXT: this.buildTransitions(schema, step.id, 'next'),
          PREVIOUS: this.buildTransitions(schema, step.id, 'previous'),
          UPDATE_FIELD: {
            actions: model.assign({
              formData: (context, event) => ({
                ...context.formData,
                [event.field]: event.value
              })
            })
          }
        },
        meta: {
          stepSchema: step.schema,
          visibilityRule: step.visibleWhen
        }
      };
    }
    
    // Add final state
    states.complete = {
      type: 'final',
      entry: 'submitForm'
    };
    
    const machine = model.createMachine({
      id: 'formFlow',
      initial: schema.steps[0]?.id || 'start',
      context: model.initialContext,
      states,
      predictableActionArguments: true
    }, {
      actions: {
        validateStep: (context, event) => {
          // Step validation logic
          console.log('Validating step:', context.currentStep);
        },
        saveProgress: (context) => {
          // Save to localStorage
          localStorage.setItem(
            `form_${schema.$id}_progress`,
            JSON.stringify(context)
          );
        },
        submitForm: async (context) => {
          // Submit form data
          console.log('Submitting form:', context.formData);
        }
      },
      guards: this.buildGuards(schema),
      services: {
        validateAsync: async (context) => {
          // Async validation service
          return true;
        }
      }
    });
    
    return machine;
  }
  
  private buildTransitions(
    schema: UnifiedFormSchema,
    stepId: string,
    direction: 'next' | 'previous'
  ): any[] {
    if (direction === 'previous') {
      // Simple previous transition
      return {
        target: this.getPreviousStepId(schema, stepId),
        actions: model.assign({
          currentStep: (context) => this.getPreviousStepId(schema, stepId)
        })
      };
    }
    
    // Build next transitions based on rules
    const transitions = schema.transitions.filter(t => t.from === stepId);
    
    return transitions.map(t => ({
      target: t.to,
      cond: t.guard || this.createGuardFromRule(t.when),
      actions: model.assign({
        currentStep: t.to,
        completedSteps: (context) => [...context.completedSteps, stepId]
      })
    }));
  }
  
  private createGuardFromRule(rule?: Rule): string {
    if (!rule) return 'always';
    
    // Generate guard name from rule
    return `guard_${JSON.stringify(rule).substring(0, 20)}`;
  }
  
  private buildGuards(schema: UnifiedFormSchema): Record<string, any> {
    const guards: Record<string, any> = {
      always: () => true
    };
    
    // Build guards from transition rules
    for (const transition of schema.transitions) {
      if (transition.when) {
        const guardName = this.createGuardFromRule(transition.when);
        guards[guardName] = (context: any) => {
          const evaluator = new RuleEvaluator();
          return evaluator.evaluate(transition.when!, context.formData);
        };
      }
    }
    
    return guards;
  }
  
  private getPreviousStepId(schema: UnifiedFormSchema, currentId: string): string {
    const index = schema.steps.findIndex(s => s.id === currentId);
    if (index > 0) {
      return schema.steps[index - 1].id;
    }
    return currentId;
  }
}
```

### 5.5 Rule Builder Utilities
```typescript
// src/rules/rule-builder.ts

export class RuleBuilder {
  static equals(field: string, value: any): ComparisonRule {
    return { op: 'eq', left: `$.${field}`, right: value };
  }
  
  static notEquals(field: string, value: any): ComparisonRule {
    return { op: 'neq', left: `$.${field}`, right: value };
  }
  
  static greaterThan(field: string, value: any): ComparisonRule {
    return { op: 'gt', left: `$.${field}`, right: value };
  }
  
  static lessThan(field: string, value: any): ComparisonRule {
    return { op: 'lt', left: `$.${field}`, right: value };
  }
  
  static in(field: string, values: any[]): ComparisonRule {
    return { op: 'in', left: `$.${field}`, right: values };
  }
  
  static matches(field: string, pattern: string): ComparisonRule {
    return { op: 'regex', left: `$.${field}`, right: pattern };
  }
  
  static and(...rules: Rule[]): LogicalRule {
    return { op: 'and', args: rules };
  }
  
  static or(...rules: Rule[]): LogicalRule {
    return { op: 'or', args: rules };
  }
  
  static not(rule: Rule): LogicalRule {
    return { op: 'not', args: [rule] };
  }
  
  static custom(functionName: string, ...args: any[]): CustomRule {
    return { op: 'custom', fn: functionName, args };
  }
  
  // Convenience methods
  static required(field: string): ComparisonRule {
    return this.notEquals(field, null);
  }
  
  static optional(field: string): LogicalRule {
    return this.or(
      this.equals(field, null),
      this.equals(field, undefined),
      this.notEquals(field, null)
    );
  }
  
  static between(field: string, min: number, max: number): LogicalRule {
    return this.and(
      this.greaterThan(field, min),
      this.lessThan(field, max)
    );
  }
  
  static oneOf(field: string, ...values: any[]): ComparisonRule {
    return this.in(field, values);
  }
}

// Usage examples:
const rule1 = RuleBuilder.and(
  RuleBuilder.equals('employmentStatus', 'employed'),
  RuleBuilder.greaterThan('income', 50000)
);

const rule2 = RuleBuilder.or(
  RuleBuilder.equals('country', 'US'),
  RuleBuilder.in('country', ['CA', 'MX'])
);
```

## Test Cases

### Rule Evaluator Tests
```typescript
describe('Rule Evaluator', () => {
  let evaluator: RuleEvaluator;
  
  beforeEach(() => {
    evaluator = new RuleEvaluator();
  });
  
  it('should evaluate comparison rules', () => {
    const rule: ComparisonRule = {
      op: 'eq',
      left: '$.status',
      right: 'active'
    };
    
    expect(evaluator.evaluate(rule, { status: 'active' })).toBe(true);
    expect(evaluator.evaluate(rule, { status: 'inactive' })).toBe(false);
  });
  
  it('should evaluate logical AND rules', () => {
    const rule: LogicalRule = {
      op: 'and',
      args: [
        { op: 'eq', left: '$.age', right: 25 },
        { op: 'eq', left: '$.city', right: 'NYC' }
      ]
    };
    
    expect(evaluator.evaluate(rule, { age: 25, city: 'NYC' })).toBe(true);
    expect(evaluator.evaluate(rule, { age: 25, city: 'LA' })).toBe(false);
  });
  
  it('should evaluate custom functions', () => {
    evaluator.registerCustomFunction('isAdult', (data) => {
      return data.age >= 18;
    });
    
    const rule: CustomRule = {
      op: 'custom',
      fn: 'isAdult',
      args: []
    };
    
    expect(evaluator.evaluate(rule, { age: 20 })).toBe(true);
    expect(evaluator.evaluate(rule, { age: 16 })).toBe(false);
  });
  
  it('should handle JSONPath queries', () => {
    const rule: ComparisonRule = {
      op: 'eq',
      left: '$.address.city',
      right: 'Boston'
    };
    
    const data = {
      address: {
        city: 'Boston',
        state: 'MA'
      }
    };
    
    expect(evaluator.evaluate(rule, data)).toBe(true);
  });
});
```

### Transition Engine Tests
```typescript
describe('Transition Engine', () => {
  let engine: TransitionEngine;
  let schema: UnifiedFormSchema;
  
  beforeEach(() => {
    engine = new TransitionEngine();
    schema = {
      $id: 'test-form',
      version: '1.0.0',
      steps: [
        { id: 'step1', title: 'Step 1' },
        { id: 'step2', title: 'Step 2' },
        { id: 'step3', title: 'Step 3' }
      ],
      transitions: [
        {
          from: 'step1',
          to: 'step2',
          when: { op: 'eq', left: '$.complete', right: true }
        },
        {
          from: 'step1',
          to: 'step3',
          when: { op: 'eq', left: '$.skip', right: true }
        },
        {
          from: 'step1',
          to: 'step2',
          default: true
        }
      ]
    } as UnifiedFormSchema;
  });
  
  it('should follow conditional transitions', () => {
    const next = engine.getNextStep(schema, 'step1', { skip: true });
    expect(next).toBe('step3');
  });
  
  it('should use default transition when no conditions match', () => {
    const next = engine.getNextStep(schema, 'step1', { other: true });
    expect(next).toBe('step2');
  });
  
  it('should find transition paths', () => {
    const path = engine.getTransitionPath(
      schema,
      'step1',
      'step3',
      { skip: true }
    );
    expect(path).toEqual(['step1', 'step3']);
  });
});
```

## Success Criteria
- ✅ Rule DSL evaluation working for all operators
- ✅ Visibility controller handles field and step visibility
- ✅ Transition engine correctly determines next/previous steps
- ✅ XState adapter identifies complex flows correctly
- ✅ Custom functions can be registered and evaluated
- ✅ Performance: Rule evaluation <5ms for typical rules
- ✅ Caching improves repeated evaluations

## Implementation Notes

### Performance Considerations
- Cache rule evaluation results
- Compile JSONPath queries once
- Use memoization for visibility checks
- Batch evaluate related rules

### Error Handling
- Graceful fallback for invalid rules
- Default to visible/enabled on errors
- Log evaluation errors for debugging
- Prevent infinite loops in recursive rules

### Testing Strategy
- Unit test each operator type
- Test complex nested rules
- Verify caching behavior
- Test XState conversion for complex forms

## Next Steps
With rule engine complete:
1. Build form renderer and stepper (Step 6)
2. Create rule debugging tools
3. Build visual rule builder UI
4. Document rule DSL syntax
5. Create rule validation utilities