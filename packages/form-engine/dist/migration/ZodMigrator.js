import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { SchemaValidator } from '../utils/schema-validator';
export class ZodMigrator {
    warnings = [];
    errors = [];
    fieldMappings = [];
    generatedTests;
    async migrate(zodSchema, options) {
        this.reset();
        try {
            const jsonSchema = zodToJsonSchema(zodSchema, {
                target: 'openApi3',
                $refStrategy: 'none',
            });
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
        }
        catch (error) {
            const message = error instanceof Error ? error.message : 'Migration failed due to an unknown error';
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
    analyzeZodSchema(schema) {
        const analysis = { fields: [] };
        const describe = (current, path, inheritedOptional) => {
            const { inner, optional } = this.unwrapType(current);
            const mergedOptional = inheritedOptional || optional;
            const typeName = inner._def?.typeName ?? '';
            switch (typeName) {
                case z.ZodFirstPartyTypeKind.ZodObject: {
                    const shape = inner._def.shape();
                    Object.entries(shape).forEach(([key, value]) => {
                        describe(value, [...path, key], mergedOptional);
                    });
                    break;
                }
                case z.ZodFirstPartyTypeKind.ZodArray: {
                    const arrayType = inner;
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
                        validations: this.extractStringValidations(inner),
                    });
                    break;
                }
                case z.ZodFirstPartyTypeKind.ZodNumber: {
                    analysis.fields.push({
                        path: path.join('.'),
                        type: 'number',
                        optional: mergedOptional,
                        validations: this.extractNumberValidations(inner),
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
                    const enumDef = inner;
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
    describeArrayItem(type, path) {
        const { inner } = this.unwrapType(type);
        const typeName = inner._def?.typeName ?? '';
        switch (typeName) {
            case z.ZodFirstPartyTypeKind.ZodString:
                return {
                    path: path.join('.'),
                    type: 'string',
                    optional: false,
                    validations: this.extractStringValidations(inner),
                };
            case z.ZodFirstPartyTypeKind.ZodNumber:
                return {
                    path: path.join('.'),
                    type: 'number',
                    optional: false,
                    validations: this.extractNumberValidations(inner),
                };
            case z.ZodFirstPartyTypeKind.ZodBoolean:
                return {
                    path: path.join('.'),
                    type: 'boolean',
                    optional: false,
                };
            case z.ZodFirstPartyTypeKind.ZodEnum: {
                const enumDef = inner;
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
    unwrapType(type) {
        let optional = false;
        let current = type;
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
    extractStringValidations(zodString) {
        const validations = {};
        const checks = zodString._def?.checks ?? [];
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
    extractNumberValidations(zodNumber) {
        const validations = {};
        const checks = zodNumber._def?.checks ?? [];
        for (const check of checks) {
            switch (check.kind) {
                case 'min':
                    if (check.inclusive === false) {
                        validations.exclusiveMinimum = check.value;
                    }
                    else {
                        validations.minimum = check.value;
                    }
                    break;
                case 'max':
                    if (check.inclusive === false) {
                        validations.exclusiveMaximum = check.value;
                    }
                    else {
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
    buildUnifiedSchema(jsonSchema, analysis) {
        const schema = {
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
            const stepSchema = { type: 'object', properties: {}, required: [] };
            fields.forEach((field) => {
                const fieldKey = field.path.split('.').pop() ?? `field_${index}`;
                const json = this.convertFieldToJsonSchema(field);
                stepSchema.properties[fieldKey] = json;
                if (!field.optional) {
                    stepSchema.required.push(fieldKey);
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
    groupFieldsIntoSteps(fields) {
        if (fields.length === 0) {
            return [[]];
        }
        if (fields.length <= 8) {
            return [fields];
        }
        const groups = [];
        for (let i = 0; i < fields.length; i += 8) {
            groups.push(fields.slice(i, i + 8));
        }
        return groups;
    }
    convertFieldToJsonSchema(field) {
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
    inferUIWidget(field, fieldKey) {
        const widgetBase = {
            component: 'Text',
            label: this.prettyLabel(fieldKey),
        };
        switch (field.type) {
            case 'number':
                return { ...widgetBase, component: 'Number' };
            case 'boolean':
                return { ...widgetBase, component: 'Checkbox' };
            case 'enum':
                return {
                    ...widgetBase,
                    component: 'Select',
                    options: field.values?.map((value) => ({
                        label: String(value),
                        value: typeof value === 'number' ? value : String(value),
                    })),
                };
            default:
                if (field.validations?.format === 'email') {
                    return { ...widgetBase, component: 'Email' };
                }
                return widgetBase;
        }
    }
    prettyLabel(fieldKey) {
        return fieldKey
            .replace(/([A-Z])/g, ' $1')
            .replace(/[_-]/g, ' ')
            .replace(/\s+/g, ' ')
            .replace(/^./, (char) => char.toUpperCase())
            .trim();
    }
    generateStepTitle(fields, index) {
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
    async validateSchema(schema) {
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
                    suggestion: 'Adjust the generated schema or update the source definition before rerunning the migration.',
                });
            });
            throw new Error('Generated schema failed validation');
        }
    }
    generateMigrationTests(schema) {
        const lines = [];
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
    calculateStats() {
        const validationsConverted = this.fieldMappings.filter((mapping) => {
            if (!mapping.validation) {
                return false;
            }
            if (typeof mapping.validation !== 'object') {
                return false;
            }
            return Object.keys(mapping.validation).length > 0;
        }).length;
        const conversionAccuracy = Math.max(0, Math.min(100, 100 - this.errors.length * 10 + this.warnings.length * -2));
        const estimatedEffort = this.errors.length > 0 ? 'high' : this.warnings.length > 5 ? 'medium' : 'low';
        return {
            fieldsConverted: this.fieldMappings.length,
            validationsConverted,
            customLogicDetected: this.warnings.filter((warning) => warning.type === 'unsupported_type')
                .length,
            conversionAccuracy,
            estimatedEffort,
        };
    }
    reset() {
        this.errors = [];
        this.warnings = [];
        this.fieldMappings = [];
        this.generatedTests = undefined;
    }
}
//# sourceMappingURL=ZodMigrator.js.map