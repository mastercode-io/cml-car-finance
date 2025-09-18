import { Parser } from 'expr-eval';

import type { ComputedField } from '../types';

interface EvaluationResult {
  path: string;
  value: unknown;
}

export class ComputedFieldEngine {
  private dependencies = new Map<string, Set<string>>();
  private computedValues = new Map<string, unknown>();
  private parser = new Parser();

  registerComputedField(field: ComputedField): void {
    field.dependsOn.forEach(dep => {
      if (!this.dependencies.has(dep)) {
        this.dependencies.set(dep, new Set());
      }
      this.dependencies.get(dep)!.add(field.path);
    });
  }

  evaluate(field: ComputedField, data: Record<string, unknown>): EvaluationResult {
    try {
      const expr = this.parser.parse(field.expr);
      const value = expr.evaluate(data as any);
      const rounded = this.applyRounding(value, field.round);
      this.computedValues.set(field.path, rounded);
      return { path: field.path, value: rounded };
    } catch (error) {
      console.warn(`Failed to evaluate computed field ${field.path}`, error);
      return { path: field.path, value: field.fallback ?? null };
    }
  }

  getComputedValue(path: string): unknown {
    return this.computedValues.get(path);
  }

  getAffectedFields(changedField: string): string[] {
    return Array.from(this.dependencies.get(changedField) ?? []);
  }

  private applyRounding(value: unknown, decimals?: number): unknown {
    if (typeof value !== 'number' || decimals === undefined) {
      return value;
    }
    const factor = Math.pow(10, decimals);
    return Math.round(value * factor) / factor;
  }
}
