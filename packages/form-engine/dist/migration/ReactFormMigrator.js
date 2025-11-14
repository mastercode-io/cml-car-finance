import * as parser from '@babel/parser';
import traverse from '@babel/traverse';
export class ReactFormMigrator {
    async migrateComponent(componentCode, options) {
        try {
            const ast = parser.parse(componentCode, {
                sourceType: 'module',
                plugins: ['jsx', 'typescript'],
            });
            const structure = this.extractFormStructure(ast);
            const schema = this.buildSchemaFromStructure(structure);
            if (options?.validateOutput && schema) {
                // The Zod migrator handles full schema validation. For React migrations we return warnings instead
                // to encourage manual review without failing the migration outright.
                if (schema.steps.length === 0) {
                    structure.warnings.push({
                        type: 'empty_schema',
                        message: 'No form fields detected in the component',
                        suggestion: 'Confirm that the component renders input elements directly.',
                    });
                }
            }
            return {
                success: true,
                schema,
                errors: [],
                warnings: structure.warnings,
                stats: this.calculateStats(structure),
            };
        }
        catch (error) {
            const migrationError = {
                type: 'parse',
                message: error instanceof Error ? error.message : 'Failed to parse React component',
            };
            return {
                success: false,
                errors: [migrationError],
                warnings: [],
                stats: {
                    fieldsConverted: 0,
                    validationsConverted: 0,
                    customLogicDetected: 0,
                    conversionAccuracy: 0,
                    estimatedEffort: 'high',
                },
            };
        }
    }
    extractFormStructure(ast) {
        const structure = {
            fields: [],
            validations: [],
            handlers: [],
            warnings: [],
        };
        traverse(ast, {
            JSXElement: (path) => {
                const element = path.node;
                const nameNode = element.openingElement.name;
                const tagName = this.getTagName(nameNode);
                if (!tagName) {
                    return;
                }
                if (this.isFormField(tagName)) {
                    const field = this.extractFieldInfo(element);
                    if (!field.name) {
                        const generatedName = `field_${structure.fields.length + 1}`;
                        structure.warnings.push({
                            type: 'missing_name',
                            message: `Detected <${tagName}> without a name attribute. Generated identifier ${generatedName}.`,
                        });
                        field.name = generatedName;
                    }
                    structure.fields.push(field);
                }
            },
            CallExpression: (path) => {
                const callee = path.node.callee;
                if (this.isRegisterCall(callee) && path.node.arguments.length > 0) {
                    const [firstArg, secondArg] = path.node.arguments;
                    if (firstArg.type === 'StringLiteral') {
                        structure.validations.push({ field: firstArg.value, rule: 'register' });
                    }
                    if (secondArg && secondArg.type === 'ObjectExpression') {
                        const requiredProp = secondArg.properties.find((prop) => prop.type === 'ObjectProperty' &&
                            prop.key.type === 'Identifier' &&
                            prop.key.name === 'required');
                        if (requiredProp && requiredProp.type === 'ObjectProperty') {
                            const fieldName = firstArg.type === 'StringLiteral' ? firstArg.value : 'unknown';
                            structure.validations.push({ field: fieldName, rule: 'required' });
                        }
                    }
                }
            },
        });
        return structure;
    }
    getTagName(node) {
        if (!node)
            return null;
        if (node.type === 'JSXIdentifier') {
            return node.name;
        }
        if (node.type === 'JSXMemberExpression') {
            return this.getTagName(node.property);
        }
        return null;
    }
    isFormField(tagName) {
        const normalised = tagName.toLowerCase();
        return ['input', 'select', 'textarea'].includes(normalised);
    }
    extractFieldInfo(element) {
        const attributes = element.openingElement.attributes ?? [];
        const field = { name: '', type: 'text' };
        attributes.forEach((attr) => {
            if (attr.type !== 'JSXAttribute' || !attr.name) {
                return;
            }
            const key = attr.name.name;
            const value = this.extractAttributeValue(attr.value);
            switch (key) {
                case 'name':
                    field.name = typeof value === 'string' ? value : '';
                    break;
                case 'type':
                    field.type = typeof value === 'string' ? value : field.type;
                    break;
                case 'label':
                case 'aria-label':
                    field.label = typeof value === 'string' ? value : field.label;
                    break;
                case 'placeholder':
                    field.placeholder = typeof value === 'string' ? value : field.placeholder;
                    break;
                case 'required':
                    field.required = value !== false;
                    break;
                case 'options':
                    if (Array.isArray(value)) {
                        field.options = value;
                    }
                    break;
                default:
                    break;
            }
        });
        return field;
    }
    extractAttributeValue(value) {
        if (!value) {
            return true;
        }
        switch (value.type) {
            case 'StringLiteral':
                return value.value;
            case 'BooleanLiteral':
                return value.value;
            case 'NumericLiteral':
                return value.value;
            case 'ArrayExpression':
                return value.elements
                    .map((element) => element && element.type === 'ObjectExpression'
                    ? this.transformOptionObject(element)
                    : null)
                    .filter(Boolean);
            case 'JSXExpressionContainer':
                return this.extractExpressionValue(value.expression);
            default:
                return null;
        }
    }
    transformOptionObject(node) {
        const option = {};
        node.properties.forEach((prop) => {
            if (prop.type !== 'ObjectProperty')
                return;
            const keyName = prop.key.type === 'Identifier' ? prop.key.name : null;
            if (!keyName)
                return;
            if (prop.value.type === 'StringLiteral' || prop.value.type === 'NumericLiteral') {
                option[keyName] = prop.value.value;
            }
        });
        if (option.label === undefined || option.value === undefined) {
            return null;
        }
        return { label: String(option.label), value: option.value };
    }
    extractExpressionValue(expression) {
        switch (expression.type) {
            case 'StringLiteral':
            case 'NumericLiteral':
            case 'BooleanLiteral':
                return expression.value;
            case 'Identifier':
                return `{${expression.name}}`;
            case 'MemberExpression':
                if (expression.object && expression.property) {
                    const objectName = expression.object.name ?? 'object';
                    const propertyName = expression.property.name ?? 'value';
                    return `{${objectName}.${propertyName}}`;
                }
                return null;
            default:
                return 'dynamic';
        }
    }
    isRegisterCall(callee) {
        if (!callee)
            return false;
        if (callee.type === 'Identifier' && callee.name === 'register') {
            return true;
        }
        if (callee.type === 'MemberExpression' && callee.property?.type === 'Identifier') {
            return callee.property.name === 'register';
        }
        return false;
    }
    buildSchemaFromStructure(structure) {
        const stepSchema = { type: 'object', properties: {}, required: [] };
        const widgets = {};
        structure.fields.forEach((field) => {
            const fieldSchema = this.inferFieldSchema(field);
            stepSchema.properties[field.name] = fieldSchema;
            if (field.required || this.hasRequiredValidation(structure, field.name)) {
                stepSchema.required.push(field.name);
            }
            widgets[field.name] = this.inferWidgetConfig(field);
        });
        if (stepSchema.required && stepSchema.required.length === 0) {
            delete stepSchema.required;
        }
        return {
            $id: `react-migrated-${Date.now()}`,
            version: '1.0.0',
            metadata: {
                title: 'Migrated React Form',
                description: 'Generated from React component analysis',
                sensitivity: 'low',
            },
            steps: stepSchema.properties && Object.keys(stepSchema.properties).length > 0
                ? [
                    {
                        id: 'step-1',
                        title: 'Form',
                        schema: stepSchema,
                    },
                ]
                : [],
            transitions: [],
            ui: { widgets },
        };
    }
    inferFieldSchema(field) {
        switch (field.type) {
            case 'number':
            case 'range':
                return { type: 'number' };
            case 'checkbox':
                return { type: 'boolean' };
            case 'select':
                return {
                    type: 'string',
                    enum: field.options?.map((option) => option.value),
                };
            case 'email':
                return { type: 'string', format: 'email' };
            case 'date':
                return { type: 'string', format: 'date' };
            default:
                return { type: 'string' };
        }
    }
    inferWidgetConfig(field) {
        const label = field.label ?? this.toLabel(field.name);
        const widgetBase = { label };
        switch (field.type) {
            case 'number':
            case 'range':
                return { ...widgetBase, component: 'Number', placeholder: field.placeholder };
            case 'checkbox':
                return { ...widgetBase, component: 'Checkbox' };
            case 'select':
                return {
                    ...widgetBase,
                    component: 'Select',
                    options: field.options,
                };
            case 'email':
                return { ...widgetBase, component: 'Email', placeholder: field.placeholder };
            default:
                return { ...widgetBase, component: 'Text', placeholder: field.placeholder };
        }
    }
    hasRequiredValidation(structure, fieldName) {
        return structure.validations.some((validation) => validation.field === fieldName && validation.rule === 'required');
    }
    toLabel(name) {
        return name
            .replace(/([A-Z])/g, ' $1')
            .replace(/[_-]/g, ' ')
            .replace(/\s+/g, ' ')
            .replace(/^./, (char) => char.toUpperCase())
            .trim();
    }
    calculateStats(structure) {
        const validationsConverted = structure.validations.filter((validation) => validation.rule === 'required').length;
        const effort = structure.warnings.length > 3 ? 'medium' : 'low';
        return {
            fieldsConverted: structure.fields.length,
            validationsConverted,
            customLogicDetected: structure.handlers.length,
            conversionAccuracy: structure.fields.length === 0 ? 0 : 80,
            estimatedEffort: effort,
        };
    }
}
//# sourceMappingURL=ReactFormMigrator.js.map