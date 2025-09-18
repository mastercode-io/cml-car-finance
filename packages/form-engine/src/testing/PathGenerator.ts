import type { FormStep, Rule, StepTransition, UnifiedFormSchema } from '../types';

export interface TestPath {
  id: string;
  steps: string[];
  conditions: Record<string, Rule>;
  data: Record<string, any>;
  expectedOutcome: 'success' | 'validation_error' | 'blocked';
}

export interface PathGenerationOptions {
  maxPaths?: number;
  maxDepth?: number;
  coverage?: 'minimal' | 'representative' | 'exhaustive';
  includeInvalid?: boolean;
  seed?: number;
}

type GenerationStrategy = 'default' | 'boundary';

export class PathGenerator {
  private paths: TestPath[] = [];
  private visited: Set<string> = new Set();
  private random: () => number = Math.random;

  generatePaths(schema: UnifiedFormSchema, options: PathGenerationOptions = {}): TestPath[] {
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
    } as const;

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

  private explorePaths(
    schema: UnifiedFormSchema,
    currentStep: string,
    path: string[],
    data: Record<string, any>,
    conditions: Record<string, Rule>,
    depth: number,
    maxDepth: number,
  ): void {
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

      this.explorePaths(
        schema,
        transition.to,
        newPath,
        branchData,
        branchConditions,
        depth + 1,
        maxDepth,
      );
    });
  }

  private generatePath(
    schema: UnifiedFormSchema,
    id: string,
    options: { strategy: GenerationStrategy },
  ): void {
    if (!schema.steps.length) {
      return;
    }

    const path: TestPath = {
      id,
      steps: [],
      conditions: {},
      data: {},
      expectedOutcome: 'success',
    };

    let currentStep: FormStep | undefined = schema.steps[0];

    while (currentStep) {
      path.steps.push(currentStep.id);
      const stepData = this.generateStepData(currentStep, options.strategy);
      path.data = { ...path.data, ...stepData };

      const transitions = schema.transitions.filter(
        (transition) => transition.from === currentStep?.id,
      );
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

  private generateStepData(
    step: FormStep | undefined,
    strategy: GenerationStrategy,
  ): Record<string, any> {
    if (!step || typeof step.schema !== 'object') {
      return {};
    }

    const data: Record<string, any> = {};
    const properties = (step.schema as any).properties ?? {};

    Object.entries(properties).forEach(([key, definition]) => {
      data[key] = this.generateFieldValue(definition, strategy);
    });

    return data;
  }

  private generateFieldValue(schema: any, strategy: GenerationStrategy): any {
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

  private generateDataForCondition(
    condition: Rule,
    schema: UnifiedFormSchema,
  ): Record<string, any> {
    const data: Record<string, any> = {};

    if (condition.op === 'eq' && typeof condition.left === 'string') {
      const field = condition.left.replace('$.', '');
      data[field] = condition.right;
    }

    if (condition.op === 'and' || condition.op === 'or') {
      const args = (condition as any).args ?? [];
      args.forEach((arg: Rule) => Object.assign(data, this.generateDataForCondition(arg, schema)));
    }

    return data;
  }

  private selectTransition(transitions: StepTransition[]): StepTransition | null {
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

  private generateBoundaryPaths(schema: UnifiedFormSchema): void {
    schema.steps.forEach((step, index) => {
      const id = `boundary-${index}`;
      this.generatePath(schema, id, { strategy: 'boundary' });
    });
  }

  private generateErrorPaths(schema: UnifiedFormSchema): void {
    schema.steps.forEach((step) => {
      if (!step.schema || typeof step.schema !== 'object') {
        return;
      }

      const required = (step.schema as any).required ?? [];
      if (!Array.isArray(required) || required.length === 0) {
        return;
      }

      const invalidData: Record<string, any> = {};
      required.forEach((field: string) => {
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

  private prunePaths(maxPaths: number): TestPath[] {
    if (this.paths.length <= maxPaths) {
      return this.paths;
    }

    return this.paths.slice(0, maxPaths);
  }

  private createRng(seed?: number): () => number {
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

  private reset(): void {
    this.paths = [];
    this.visited = new Set();
    this.random = Math.random;
  }
}
