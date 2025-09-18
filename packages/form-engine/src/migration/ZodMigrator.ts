import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';

import type {
  FieldMapping,
  MigrationConfig,
  MigrationError,
  MigrationResult,
  MigrationStats,
  MigrationWarning,
  UnifiedFormSchema,
  JSONSchema,
} from '../types';
import { SchemaValidator } from '../utils/schema-validator';

interface FieldAnalysis {
  path: string;
  type: string;
  optional: boolean;
  validations?: Record<string, unknown>;
  values?: unknown[];
  items?: FieldAnalysis;
}

interface SchemaAnalysis {
  fields: FieldAnalysis[];
}

export class ZodMigrator {
  private warnings: MigrationWarning[] = [];
  private errors: MigrationError[] = [];
  private fieldMappings: FieldMapping[] = [];
  private generatedTests?: string;

  async migrate(
    zodSchema: z.ZodSchema<any>,
    options?: MigrationConfig['options'],
  ): Promise<MigrationResult> {
    this.reset();

    try {
      const jsonSchema = zodToJsonSchema(zodSchema, {
        target: 'openApi3',
        $refStrategy: 'none',
      }) as JSONSchema;

      const formStructure = this.analyzeZodSchema(zodSchema);
      const unifiedSchema = this.buildUnifiedSchema(jsonSchema, formStructure);

      if (options?.validateOutput) {
        await this.validateSchema(unifiedSchema);
      }

      if (options?.generateTests) {
        this.generatedTests = this.generateMigrationTests(unifiedSchema);
      }

      return {
        success: this.errors.length === 0,
        schema: unifiedSchema,
        errors: [...this.errors],
        warnings: [...this.warnings],
        stats: this.calculateStats(),
        generatedTests: this.generatedTests,
      };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Migration failed due to an unknown error';

      this.errors.push({
        type: 'unknown',
        message,
      });

      return {
        success: false,
        errors: [...this.errors],
        warnings: [...this.warnings],
        stats: this.calculateStats(),
      };
    }
  }

  private analyzeZodSchema(schema: z.ZodSchema<any>): SchemaAnalysis {
    const analysis: SchemaAnalysis = { fields: [] };

    const describe = (current: z.ZodTypeAny, path: string[], inheritedOptional: boolean): void => {
      const { inner, optional } = this.unwrapType(current);
      const mergedOptional = inheritedOptional || optional;
      const typeName = inner._def?.typeName ?? '';

      switch (typeName) {
        case z.ZodFirstPartyTypeKind.ZodObject: {
          const shape = (inner as z.ZodObject<any>)._def.shape();
          Object.entries(shape).forEach(([key, value]) => {
            describe(value as z.ZodTypeAny, [...path, key], mergedOptional);
          });
          break;
        }
        case z.ZodFirstPartyTypeKind.ZodArray: {
          const arrayType = inner as z.ZodArray<any>;
          const itemAnalysis = this.describeArrayItem(arrayType.element, [...path, '[*]']);

          analysis.fields.push({
            path: path.join('.'),
            type: 'array',
            optional: mergedOptional,
            items: itemAnalysis,
          });
          break;
        }
        case z.ZodFirstPartyTypeKind.ZodString: {
          analysis.fields.push({
            path: path.join('.'),
            type: 'string',
            optional: mergedOptional,
            validations: this.extractStringValidations(inner as z.ZodString),
          });
          break;
        }
        case z.ZodFirstPartyTypeKind.ZodNumber: {
          analysis.fields.push({
            path: path.join('.'),
            type: 'number',
            optional: mergedOptional,
            validations: this.extractNumberValidations(inner as z.ZodNumber),
          });
          break;
        }
        case z.ZodFirstPartyTypeKind.ZodBoolean: {
          analysis.fields.push({
            path: path.join('.'),
            type: 'boolean',
            optional: mergedOptional,
          });
          break;
        }
        case z.ZodFirstPartyTypeKind.ZodEnum: {
          const enumDef = inner as z.ZodEnum<any>;
          analysis.fields.push({
            path: path.join('.'),
            type: 'enum',
            optional: mergedOptional,
            values: [...enumDef._def.values],
          });
          break;
        }
        default: {
          this.warnings.push({
            type: 'unsupported_type',
            message: `Unsupported Zod type encountered at ${path.join('.') || 'root'} (${typeName})`,
            suggestion: 'Consider handling this field manually after migration',
          });
          break;
        }
      }
    };

    describe(schema, [], false);

    return analysis;
  }

  private describeArrayItem(type: z.ZodTypeAny, path: string[]): FieldAnalysis | undefined {
    const { inner } = this.unwrapType(type);
    const typeName = inner._def?.typeName ?? '';

    switch (typeName) {
      case z.ZodFirstPartyTypeKind.ZodString:
        return {
          path: path.join('.'),
          type: 'string',
          optional: false,
          validations: this.extractStringValidations(inner as z.ZodString),
        };
      case z.ZodFirstPartyTypeKind.ZodNumber:
        return {
          path: path.join('.'),
          type: 'number',
          optional: false,
          validations: this.extractNumberValidations(inner as z.ZodNumber),
        };
      case z.ZodFirstPartyTypeKind.ZodBoolean:
        return {
          path: path.join('.'),
          type: 'boolean',
          optional: false,
        };
      case z.ZodFirstPartyTypeKind.ZodEnum: {
        const enumDef = inner as z.ZodEnum<any>;
        return {
          path: path.join('.'),
          type: 'enum',
          optional: false,
          values: [...enumDef._def.values],
        };
      }
      default:
        this.warnings.push({
          type: 'array_item',
          message: `Array item at ${path.join('.')} defaults to string representation`,
          suggestion: 'Review array items and adjust the generated schema manually if required',
        });
        return {
          path: path.join('.'),
          type: 'string',
          optional: false,
        };
    }
  }

  private unwrapType(type: z.ZodTypeAny): { inner: z.ZodTypeAny; optional: boolean } {
    let optional = false;
    let current: z.ZodTypeAny = type;

    while (true) {
      if (current instanceof z.ZodOptional || current instanceof z.ZodNullable) {
        optional = true;
        current = current._def.innerType;
        continue;
      }

      if (current instanceof z.ZodDefault) {
        current = current._def.innerType;
        continue;
      }

      if (current instanceof z.ZodEffects) {
        current = current._def.schema;
        continue;
      }

      break;
    }

    return { inner: current, optional };
  }

  private extractStringValidations(zodString: z.ZodString): Record<string, unknown> {
    const validations: Record<string, unknown> = {};
    const checks = (zodString as any)._def?.checks ?? [];

    for (const check of checks) {
      switch (check.kind) {
        case 'min':
          validations.minLength = check.value;
          break;
        case 'max':
          validations.maxLength = check.value;
          break;
        case 'email':
          validations.format = 'email';
          break;
        case 'url':
          validations.format = 'uri';
          break;
        case 'regex':
          validations.pattern = check.regex?.source;
          break;
        case 'uuid':
          validations.format = 'uuid';
          break;
        default:
          break;
      }
    }

    return validations;
  }

  private extractNumberValidations(zodNumber: z.ZodNumber): Record<string, unknown> {
    const validations: Record<string, unknown> = {};
    const checks = (zodNumber as any)._def?.checks ?? [];

    for (const check of checks) {
      switch (check.kind) {
        case 'min':
          if (check.inclusive === false) {
            validations.exclusiveMinimum = check.value;
          } else {
            validations.minimum = check.value;
          }
          break;
        case 'max':
          if (check.inclusive === false) {
            validations.exclusiveMaximum = check.value;
          } else {
            validations.maximum = check.value;
          }
          break;
        case 'int':
          validations.multipleOf = 1;
          break;
        case 'multipleOf':
          validations.multipleOf = check.value;
          break;
        default:
          break;
      }
    }

    return validations;
  }

  private buildUnifiedSchema(jsonSchema: JSONSchema, analysis: SchemaAnalysis): UnifiedFormSchema {
    const schema: UnifiedFormSchema = {
      $id: `migrated-${Date.now()}`,
      version: '1.0.0',
      metadata: {
        title: 'Migrated Form',
        description: 'Form migrated from an existing schema definition',
        sensitivity: 'low',
      },
      definitions: jsonSchema.definitions ?? jsonSchema.$defs ?? {},
      steps: [],
      transitions: [],
      ui: { widgets: {} },
    };

    const groupedFields = this.groupFieldsIntoSteps(analysis.fields);

    groupedFields.forEach((fields, index) => {
      const stepId = `step-${index + 1}`;
      const stepSchema: JSONSchema = { type: 'object', properties: {}, required: [] };

      fields.forEach((field) => {
        const fieldKey = field.path.split('.').pop() ?? `field_${index}`;
        const json = this.convertFieldToJsonSchema(field);
        stepSchema.properties![fieldKey] = json;
        if (!field.optional) {
          stepSchema.required!.push(fieldKey);
        }

        const widget = this.inferUIWidget(field, fieldKey);

        this.fieldMappings.push({
          source: field.path,
          target: `${stepId}.${fieldKey}`,
          validation: json,
          ui: widget,
        });

        schema.ui.widgets[fieldKey] = widget;
      });

      if (stepSchema.required && stepSchema.required.length === 0) {
        delete stepSchema.required;
      }

      schema.steps.push({
        id: stepId,
        title: this.generateStepTitle(fields, index),
        schema: stepSchema,
      });

      const nextStep = groupedFields[index + 1];
      if (nextStep) {
        schema.transitions.push({ from: stepId, to: `step-${index + 2}`, default: true });
      }
    });

    return schema;
  }

  private groupFieldsIntoSteps(fields: FieldAnalysis[]): FieldAnalysis[][] {
    if (fields.length === 0) {
      return [[]];
    }

    if (fields.length <= 8) {
      return [fields];
    }

    const groups: FieldAnalysis[][] = [];
    for (let i = 0; i < fields.length; i += 8) {
      groups.push(fields.slice(i, i + 8));
    }
    return groups;
  }

  private convertFieldToJsonSchema(field: FieldAnalysis): JSONSchema {
    switch (field.type) {
      case 'number':
        return {
          type: 'number',
          ...field.validations,
        };
      case 'boolean':
        return { type: 'boolean' };
      case 'enum':
        return {
          type: 'string',
          enum: field.values,
        };
      case 'array':
        return {
          type: 'array',
          items: field.items ? this.convertFieldToJsonSchema(field.items) : {},
        };
      case 'string':
      default:
        return {
          type: 'string',
          ...field.validations,
        };
    }
  }

  private inferUIWidget(field: FieldAnalysis, fieldKey: string) {
    const widgetBase = {
      component: 'Text' as const,
      label: this.prettyLabel(fieldKey),
    };

    switch (field.type) {
      case 'number':
        return { ...widgetBase, component: 'Number' as const };
      case 'boolean':
        return { ...widgetBase, component: 'Checkbox' as const };
      case 'enum':
        return {
          ...widgetBase,
          component: 'Select' as const,
          options: field.values?.map((value) => ({
            label: String(value),
            value: typeof value === 'number' ? value : String(value),
          })),
        };
      default:
        if (field.validations?.format === 'email') {
          return { ...widgetBase, component: 'Email' as const };
        }
        return widgetBase;
    }
  }

  private prettyLabel(fieldKey: string): string {
    return fieldKey
      .replace(/([A-Z])/g, ' $1')
      .replace(/[_-]/g, ' ')
      .replace(/\s+/g, ' ')
      .replace(/^./, (char) => char.toUpperCase())
      .trim();
  }

  private generateStepTitle(fields: FieldAnalysis[], index: number): string {
    if (fields.length === 0) {
      return `Step ${index + 1}`;
    }

    const hint = fields[0].path.toLowerCase();
    if (hint.includes('employment')) {
      return 'Employment Details';
    }
    if (hint.includes('address')) {
      return 'Address Information';
    }
    if (hint.includes('contact') || hint.includes('email')) {
      return 'Contact Details';
    }
    return `Step ${index + 1}`;
  }

  private async validateSchema(schema: UnifiedFormSchema): Promise<void> {
    const validator = new SchemaValidator();
    const validation = validator.validateSchema(schema);

    if (!validation.valid) {
      validation.errors.forEach((error) => {
        this.errors.push({
          type: 'validation',
          message: error.message,
          location: {
            file: schema.$id,
          },
          suggestion:
            'Adjust the generated schema or update the source definition before rerunning the migration.',
        });
      });

      throw new Error('Generated schema failed validation');
    }
  }

  private generateMigrationTests(schema: UnifiedFormSchema): string {
    const lines: string[] = [];
    lines.push(`describe('Migrated Form: ${schema.metadata.title}', () => {`);
    lines.push(`  it('includes ${schema.steps.length} steps', () => {`);
    lines.push('    expect(schema.steps).toHaveLength(' + schema.steps.length + ');');
    lines.push('  });');
    lines.push('');
    lines.push("  it('defines transitions that link all steps', () => {");
    lines.push('    const stepIds = new Set(schema.steps.map((step) => step.id));');
    lines.push('    schema.transitions.forEach((transition) => {');
    lines.push('      expect(stepIds.has(transition.from)).toBe(true);');
    lines.push('      expect(stepIds.has(transition.to)).toBe(true);');
    lines.push('    });');
    lines.push('  });');
    lines.push('});');
    return lines.join('\n');
  }

  private calculateStats(): MigrationStats {
    const validationsConverted = this.fieldMappings.filter((mapping) => {
      if (!mapping.validation) {
        return false;
      }

      if (typeof mapping.validation !== 'object') {
        return false;
      }

      return Object.keys(mapping.validation as Record<string, unknown>).length > 0;
    }).length;

    const conversionAccuracy = Math.max(
      0,
      Math.min(100, 100 - this.errors.length * 10 + this.warnings.length * -2),
    );

    const estimatedEffort: MigrationStats['estimatedEffort'] =
      this.errors.length > 0 ? 'high' : this.warnings.length > 5 ? 'medium' : 'low';

    return {
      fieldsConverted: this.fieldMappings.length,
      validationsConverted,
      customLogicDetected: this.warnings.filter((warning) => warning.type === 'unsupported_type')
        .length,
      conversionAccuracy,
      estimatedEffort,
    };
  }

  private reset(): void {
    this.errors = [];
    this.warnings = [];
    this.fieldMappings = [];
    this.generatedTests = undefined;
  }
}
