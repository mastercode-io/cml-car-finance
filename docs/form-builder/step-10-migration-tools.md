# Step 10: Migration Tools & Testing

## Step Description
Build comprehensive migration utilities for converting existing forms to the new schema-driven format, along with advanced testing tools for path generation and validation coverage. This step ensures smooth transition from legacy forms and robust testing capabilities.

## Prerequisites
- Step 9 (Performance & Analytics) completed
- Understanding of existing form systems (Zod, plain React)
- Form renderer fully functional
- Schema validation working
- AST parsing knowledge helpful

## Detailed To-Do List

### 10.1 Install Required Dependencies
```bash
npm install --save @babel/parser @babel/traverse zod-to-json-schema
npm install --save-dev @types/babel__traverse
```

### 10.2 Create Migration Types
```typescript
// src/types/migration.types.ts

export interface MigrationConfig {
  source: 'zod' | 'react' | 'html' | 'json';
  target: 'unified-schema';
  options?: {
    preserveComments?: boolean;
    generateTests?: boolean;
    validateOutput?: boolean;
    interactive?: boolean;
    customTransforms?: Record<string, Function>;
  };
}

export interface MigrationResult {
  success: boolean;
  schema?: UnifiedFormSchema;
  errors: MigrationError[];
  warnings: MigrationWarning[];
  stats: MigrationStats;
}

export interface MigrationError {
  type: 'parse' | 'validation' | 'transform' | 'unknown';
  message: string;
  location?: {
    line?: number;
    column?: number;
    file?: string;
  };
  suggestion?: string;
}

export interface MigrationWarning {
  type: string;
  message: string;
  suggestion?: string;
}

export interface MigrationStats {
  fieldsConverted: number;
  validationsConverted: number;
  customLogicDetected: number;
  conversionAccuracy: number; // 0-100%
  estimatedEffort: 'low' | 'medium' | 'high';
}

export interface FieldMapping {
  source: string;
  target: string;
  transform?: (value: any) => any;
  validation?: any;
  ui?: any;
}
```

### 10.3 Implement Zod Schema Migrator
```typescript
// src/migration/ZodMigrator.ts

import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';

export class ZodMigrator {
  private warnings: MigrationWarning[] = [];
  private errors: MigrationError[] = [];
  private fieldMappings: FieldMapping[] = [];
  
  async migrate(
    zodSchema: z.ZodSchema<any>,
    options?: MigrationConfig['options']
  ): Promise<MigrationResult> {
    this.reset();
    
    try {
      // Convert Zod to JSON Schema
      const jsonSchema = zodToJsonSchema(zodSchema, {
        target: 'openApi3',
        $refStrategy: 'none'
      });
      
      // Extract form structure
      const formStructure = this.analyzeZodSchema(zodSchema);
      
      // Build unified schema
      const unifiedSchema = this.buildUnifiedSchema(
        jsonSchema,
        formStructure
      );
      
      // Validate output
      if (options?.validateOutput) {
        await this.validateSchema(unifiedSchema);
      }
      
      // Generate tests if requested
      if (options?.generateTests) {
        this.generateMigrationTests(unifiedSchema);
      }
      
      return {
        success: true,
        schema: unifiedSchema,
        errors: this.errors,
        warnings: this.warnings,
        stats: this.calculateStats()
      };
    } catch (error) {
      this.errors.push({
        type: 'unknown',
        message: error instanceof Error ? error.message : 'Migration failed'
      });
      
      return {
        success: false,
        errors: this.errors,
        warnings: this.warnings,
        stats: this.calculateStats()
      };
    }
  }
  
  private analyzeZodSchema(schema: z.ZodSchema<any>): any {
    const analysis: any = {
      fields: [],
      validations: [],
      transforms: [],
      refinements: []
    };
    
    // Recursive analysis
    const analyze = (zodType: any, path: string[] = []) => {
      const typeName = zodType._def?.typeName;
      
      switch (typeName) {
        case 'ZodObject':
          const shape = zodType._def.shape();
          Object.entries(shape).forEach(([key, value]) => {
            analyze(value as any, [...path, key]);
          });
          break;
          
        case 'ZodString':
          analysis.fields.push({
            path: path.join('.'),
            type: 'string',
            validations: this.extractStringValidations(zodType)
          });
          break;
          
        case 'ZodNumber':
          analysis.fields.push({
            path: path.join('.'),
            type: 'number',
            validations: this.extractNumberValidations(zodType)
          });
          break;
          
        case 'ZodBoolean':
          analysis.fields.push({
            path: path.join('.'),
            type: 'boolean'
          });
          break;
          
        case 'ZodArray':
          analysis.fields.push({
            path: path.join('.'),
            type: 'array',
            items: analyze(zodType._def.type, [...path, '[]'])
          });
          break;
          
        case 'ZodEnum':
          analysis.fields.push({
            path: path.join('.'),
            type: 'enum',
            values: zodType._def.values
          });
          break;
          
        case 'ZodUnion':
        case 'ZodDiscriminatedUnion':
          this.warnings.push({
            type: 'complex_type',
            message: `Complex union type at ${path.join('.')}, manual review needed`,
            suggestion: 'Consider simplifying to enum or separate fields'
          });
          break;
          
        default:
          this.warnings.push({
            type: 'unsupported_type',
            message: `Unsupported Zod type: ${typeName} at ${path.join('.')}`,
            suggestion: 'Manual conversion required'
          });
      }
    };
    
    analyze(schema);
    
    // Extract refinements (custom validations)
    if (schema._def.checks) {
      analysis.refinements = schema._def.checks.map((check: any) => ({
        kind: check.kind,
        message: check.message,
        params: check.params
      }));
    }
    
    return analysis;
  }
  
  private extractStringValidations(zodString: z.ZodString): any {
    const validations: any = {};
    const checks = (zodString as any)._def.checks || [];
    
    checks.forEach((check: any) => {
      switch (check.kind) {
        case 'min':
          validations.minLength = check.value;
          break;
        case 'max':
          validations.maxLength = check.value;
          break;
        case 'regex':
          validations.pattern = check.regex.source;
          break;
        case 'email':
          validations.format = 'email';
          break;
        case 'url':
          validations.format = 'uri';
          break;
        case 'uuid':
          validations.format = 'uuid';
          break;
        case 'cuid':
        case 'cuid2':
          validations.format = 'cuid';
          this.warnings.push({
            type: 'format_conversion',
            message: 'CUID format converted to custom format',
            suggestion: 'Add custom format validator for CUID'
          });
          break;
      }
    });
    
    return validations;
  }
  
  private extractNumberValidations(zodNumber: z.ZodNumber): any {
    const validations: any = {};
    const checks = (zodNumber as any)._def.checks || [];
    
    checks.forEach((check: any) => {
      switch (check.kind) {
        case 'min':
          validations.minimum = check.value;
          if (check.inclusive === false) {
            validations.exclusiveMinimum = check.value;
            delete validations.minimum;
          }
          break;
        case 'max':
          validations.maximum = check.value;
          if (check.inclusive === false) {
            validations.exclusiveMaximum = check.value;
            delete validations.maximum;
          }
          break;
        case 'int':
          validations.multipleOf = 1;
          break;
        case 'multipleOf':
          validations.multipleOf = check.value;
          break;
      }
    });
    
    return validations;
  }
  
  private buildUnifiedSchema(
    jsonSchema: any,
    formStructure: any
  ): UnifiedFormSchema {
    const schema: UnifiedFormSchema = {
      $id: `migrated-${Date.now()}`,
      version: '1.0.0',
      metadata: {
        title: 'Migrated Form',
        description: 'Form migrated from Zod schema',
        sensitivity: 'low',
        migrationDate: new Date().toISOString(),
        sourceType: 'zod'
      },
      definitions: {},
      steps: [],
      transitions: [],
      ui: { widgets: {} }
    };
    
    // Group fields into logical steps
    const steps = this.groupFieldsIntoSteps(formStructure.fields);
    
    steps.forEach((stepFields, index) => {
      const stepId = `step${index + 1}`;
      
      // Create step schema
      const stepSchema: JSONSchema = {
        type: 'object',
        properties: {},
        required: []
      };
      
      stepFields.forEach((field: any) => {
        const fieldName = field.path.split('.').pop();
        stepSchema.properties![fieldName] = this.convertFieldToJsonSchema(field);
        
        // Add UI configuration
        schema.ui!.widgets[fieldName] = this.inferUIWidget(field);
        
        // Track field mapping
        this.fieldMappings.push({
          source: field.path,
          target: fieldName,
          validation: field.validations
        });
      });
      
      schema.steps.push({
        id: stepId,
        title: this.generateStepTitle(stepFields),
        schema: stepSchema
      });
      
      // Add default transitions
      if (index < steps.length - 1) {
        schema.transitions.push({
          from: stepId,
          to: `step${index + 2}`,
          default: true
        });
      }
    });
    
    return schema;
  }
  
  private groupFieldsIntoSteps(fields: any[]): any[][] {
    // Intelligent grouping based on field names and types
    const groups: any[][] = [];
    let currentGroup: any[] = [];
    
    const personalFields = ['name', 'email', 'phone', 'address', 'birth'];
    const employmentFields = ['employment', 'job', 'company', 'salary'];
    const preferencesFields = ['preferences', 'settings', 'notifications'];
    
    fields.forEach(field => {
      const fieldName = field.path.toLowerCase();
      
      // Check if field belongs to a specific group
      const isPersonal = personalFields.some(pf => fieldName.includes(pf));
      const isEmployment = employmentFields.some(ef => fieldName.includes(ef));
      const isPreferences = preferencesFields.some(pf => fieldName.includes(pf));
      
      // Start new group if category changes
      if (currentGroup.length > 0) {
        const lastField = currentGroup[currentGroup.length - 1];
        const lastCategory = this.getFieldCategory(lastField.path);
        const currentCategory = this.getFieldCategory(field.path);
        
        if (lastCategory !== currentCategory && currentGroup.length >= 3) {
          groups.push(currentGroup);
          currentGroup = [];
        }
      }
      
      currentGroup.push(field);
      
      // Limit group size
      if (currentGroup.length >= 8) {
        groups.push(currentGroup);
        currentGroup = [];
      }
    });
    
    if (currentGroup.length > 0) {
      groups.push(currentGroup);
    }
    
    return groups.length > 0 ? groups : [fields];
  }
  
  private getFieldCategory(path: string): string {
    const lower = path.toLowerCase();
    
    if (['name', 'email', 'phone', 'address'].some(f => lower.includes(f))) {
      return 'personal';
    }
    if (['employment', 'job', 'company'].some(f => lower.includes(f))) {
      return 'employment';
    }
    if (['preferences', 'settings'].some(f => lower.includes(f))) {
      return 'preferences';
    }
    
    return 'other';
  }
  
  private generateStepTitle(fields: any[]): string {
    const categories = fields.map(f => this.getFieldCategory(f.path));
    const primaryCategory = categories[0];
    
    const titles: Record<string, string> = {
      personal: 'Personal Information',
      employment: 'Employment Details',
      preferences: 'Preferences',
      other: 'Additional Information'
    };
    
    return titles[primaryCategory] || 'Information';
  }
  
  private convertFieldToJsonSchema(field: any): JSONSchema {
    const schema: JSONSchema = { type: field.type };
    
    if (field.validations) {
      Object.assign(schema, field.validations);
    }
    
    if (field.values) {
      schema.enum = field.values;
    }
    
    return schema;
  }
  
  private inferUIWidget(field: any): any {
    const widget: any = {
      label: this.humanizeFieldName(field.path)
    };
    
    // Infer widget type
    if (field.type === 'string') {
      if (field.validations?.format === 'email') {
        widget.component = 'Email';
      } else if (field.validations?.maxLength > 100) {
        widget.component = 'TextArea';
      } else {
        widget.component = 'Text';
      }
    } else if (field.type === 'number') {
      widget.component = 'Number';
    } else if (field.type === 'boolean') {
      widget.component = 'Checkbox';
    } else if (field.type === 'enum') {
      widget.component = 'Select';
      widget.options = field.values.map((v: string) => ({
        label: this.humanizeFieldName(v),
        value: v
      }));
    } else if (field.type === 'array') {
      widget.component = 'Repeater';
    }
    
    return widget;
  }
  
  private humanizeFieldName(path: string): string {
    const name = path.split('.').pop() || path;
    return name
      .replace(/([A-Z])/g, ' $1')
      .replace(/_/g, ' ')
      .trim()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }
  
  private async validateSchema(schema: UnifiedFormSchema): Promise<void> {
    // Validate against unified schema meta-schema
    const validator = new SchemaValidator();
    const result = validator.validateSchema(schema);
    
    if (!result.valid) {
      result.errors.forEach(error => {
        this.errors.push({
          type: 'validation',
          message: error.message || 'Schema validation failed'
        });
      });
    }
  }
  
  private generateMigrationTests(schema: UnifiedFormSchema): void {
    // Generate test file for migrated schema
    const tests = `
describe('Migrated Form: ${schema.metadata.title}', () => {
  it('should have correct structure', () => {
    expect(schema.steps).toHaveLength(${schema.steps.length});
    expect(schema.transitions).toHaveLength(${schema.transitions.length});
  });
  
  it('should validate required fields', () => {
    ${schema.steps.map(step => `
    // Test ${step.title}
    const ${step.id}Result = validator.validate(
      schema.steps['${step.id}'].schema,
      {}
    );
    expect(${step.id}Result.valid).toBe(false);
    `).join('\n')}
  });
});`;
    
    console.log('Generated test file:', tests);
  }
  
  private calculateStats(): MigrationStats {
    return {
      fieldsConverted: this.fieldMappings.length,
      validationsConverted: this.fieldMappings.filter(f => f.validation).length,
      customLogicDetected: this.warnings.filter(w => w.type === 'complex_type').length,
      conversionAccuracy: Math.round((1 - (this.errors.length / Math.max(this.fieldMappings.length, 1))) * 100),
      estimatedEffort: this.errors.length > 5 ? 'high' : this.warnings.length > 10 ? 'medium' : 'low'
    };
  }
  
  private reset(): void {
    this.warnings = [];
    this.errors = [];
    this.fieldMappings = [];
  }
}
```

### 10.4 Create React Component Migrator
```typescript
// src/migration/ReactFormMigrator.ts

import * as parser from '@babel/parser';
import traverse from '@babel/traverse';

export class ReactFormMigrator {
  async migrateComponent(
    componentCode: string,
    options?: MigrationConfig['options']
  ): Promise<MigrationResult> {
    try {
      // Parse React component
      const ast = parser.parse(componentCode, {
        sourceType: 'module',
        plugins: ['jsx', 'typescript']
      });
      
      // Extract form structure
      const formStructure = this.extractFormStructure(ast);
      
      // Build unified schema
      const schema = this.buildSchemaFromStructure(formStructure);
      
      return {
        success: true,
        schema,
        errors: [],
        warnings: [],
        stats: this.calculateStats(formStructure)
      };
    } catch (error) {
      return {
        success: false,
        errors: [{
          type: 'parse',
          message: error instanceof Error ? error.message : 'Parse failed'
        }],
        warnings: [],
        stats: {
          fieldsConverted: 0,
          validationsConverted: 0,
          customLogicDetected: 0,
          conversionAccuracy: 0,
          estimatedEffort: 'high'
        }
      };
    }
  }
  
  private extractFormStructure(ast: any): any {
    const structure = {
      fields: [],
      validations: [],
      handlers: []
    };
    
    traverse(ast, {
      JSXElement(path) {
        const element = path.node;
        const tagName = element.openingElement.name;
        
        if (this.isFormField(tagName)) {
          structure.fields.push(this.extractFieldInfo(element));
        }
      },
      
      CallExpression(path) {
        const callee = path.node.callee;
        
        // Detect validation calls
        if (this.isValidationCall(callee)) {
          structure.validations.push(this.extractValidation(path.node));
        }
      }
    });
    
    return structure;
  }
  
  private isFormField(tagName: any): boolean {
    const fieldTags = ['input', 'Input', 'select', 'Select', 'textarea', 'TextArea'];
    
    if (tagName.type === 'JSXIdentifier') {
      return fieldTags.includes(tagName.name);
    }
    
    return false;
  }
  
  private extractFieldInfo(element: any): any {
    const attributes = element.openingElement.attributes;
    const fieldInfo: any = {};
    
    attributes.forEach((attr: any) => {
      if (attr.type === 'JSXAttribute') {
        const name = attr.name.name;
        const value = this.extractAttributeValue(attr.value);
        fieldInfo[name] = value;
      }
    });
    
    return fieldInfo;
  }
  
  private extractAttributeValue(value: any): any {
    if (!value) return true;
    
    switch (value.type) {
      case 'StringLiteral':
        return value.value;
      case 'JSXExpressionContainer':
        return this.extractExpressionValue(value.expression);
      default:
        return null;
    }
  }
  
  private extractExpressionValue(expression: any): any {
    switch (expression.type) {
      case 'Identifier':
        return `{${expression.name}}`;
      case 'MemberExpression':
        return `{${expression.object.name}.${expression.property.name}}`;
      default:
        return null;
    }
  }
  
  private isValidationCall(callee: any): boolean {
    // Detect common validation patterns
    return false; // Simplified for brevity
  }
  
  private extractValidation(node: any): any {
    return {}; // Simplified for brevity
  }
  
  private buildSchemaFromStructure(structure: any): UnifiedFormSchema {
    // Convert extracted structure to unified schema
    return {} as UnifiedFormSchema; // Simplified for brevity
  }
  
  private calculateStats(structure: any): MigrationStats {
    return {
      fieldsConverted: structure.fields.length,
      validationsConverted: structure.validations.length,
      customLogicDetected: 0,
      conversionAccuracy: 80,
      estimatedEffort: 'medium'
    };
  }
}
```

### 10.5 Create Test Path Generator
```typescript
// src/testing/PathGenerator.ts

export interface TestPath {
  id: string;
  steps: string[];
  conditions: Record<string, any>;
  data: Record<string, any>;
  expectedOutcome: 'success' | 'validation_error' | 'blocked';
}

export interface PathGenerationOptions {
  maxPaths?: number;
  maxDepth?: number;
  coverage?: 'minimal' | 'representative' | 'exhaustive';
  includeInvalid?: boolean;
  seed?: number; // For deterministic generation
}

export class PathGenerator {
  private paths: TestPath[] = [];
  private visited: Set<string> = new Set();
  
  generatePaths(
    schema: UnifiedFormSchema,
    options: PathGenerationOptions = {}
  ): TestPath[] {
    this.reset();
    
    const config = {
      maxPaths: options.maxPaths || 10,
      maxDepth: options.maxDepth || 20,
      coverage: options.coverage || 'representative',
      includeInvalid: options.includeInvalid !== false
    };
    
    // Generate based on coverage type
    switch (config.coverage) {
      case 'minimal':
        this.generateMinimalPaths(schema, config);
        break;
      case 'exhaustive':
        this.generateExhaustivePaths(schema, config);
        break;
      default:
        this.generateRepresentativePaths(schema, config);
    }
    
    return this.prunePaths(config.maxPaths);
  }
  
  private generateMinimalPaths(
    schema: UnifiedFormSchema,
    config: any
  ): void {
    // Happy path
    this.generatePath(schema, 'happy-path', {
      strategy: 'valid-only',
      choices: 'default'
    });
    
    // One error path
    if (config.includeInvalid) {
      this.generatePath(schema, 'error-path', {
        strategy: 'invalid-first-step'
      });
    }
  }
  
  private generateRepresentativePaths(
    schema: UnifiedFormSchema,
    config: any
  ): void {
    // All branch combinations
    const branches = this.identifyBranches(schema);
    
    branches.forEach((branch, index) => {
      this.generatePath(schema, `branch-${index}`, {
        strategy: 'follow-branch',
        branch: branch
      });
    });
    
    // Boundary value paths
    this.generateBoundaryPaths(schema);
    
    // Error recovery paths
    if (config.includeInvalid) {
      this.generateErrorPaths(schema);
    }
  }
  
  private generateExhaustivePaths(
    schema: UnifiedFormSchema,
    config: any
  ): void {
    // Generate all possible paths (with pruning)
    this.explorePaths(
      schema,
      schema.steps[0].id,
      [],
      {},
      0,
      config.maxDepth
    );
  }
  
  private explorePaths(
    schema: UnifiedFormSchema,
    currentStep: string,
    path: string[],
    data: any,
    depth: number,
    maxDepth: number
  ): void {
    if (depth > maxDepth) return;
    
    const pathKey = path.join('-');
    if (this.visited.has(pathKey)) return;
    this.visited.add(pathKey);
    
    const newPath = [...path, currentStep];
    
    // Get possible transitions
    const transitions = schema.transitions.filter(t => t.from === currentStep);
    
    if (transitions.length === 0) {
      // End of path
      this.paths.push({
        id: `path-${this.paths.length}`,
        steps: newPath,
        conditions: {},
        data: data,
        expectedOutcome: 'success'
      });
      return;
    }
    
    // Explore each transition
    transitions.forEach(transition => {
      if (transition.when) {
        // Generate data that satisfies condition
        const satisfyingData = this.generateDataForCondition(
          transition.when,
          schema
        );
        
        this.explorePaths(
          schema,
          transition.to,
          newPath,
          { ...data, ...satisfyingData },
          depth + 1,
          maxDepth
        );
      } else if (transition.default) {
        // Default transition
        this.explorePaths(
          schema,
          transition.to,
          newPath,
          data,
          depth + 1,
          maxDepth
        );
      }
    });
  }
  
  private identifyBranches(schema: UnifiedFormSchema): any[] {
    const branches: any[] = [];
    
    schema.transitions.forEach(transition => {
      if (transition.when) {
        branches.push({
          from: transition.from,
          to: transition.to,
          condition: transition.when
        });
      }
    });
    
    return branches;
  }
  
  private generatePath(
    schema: UnifiedFormSchema,
    id: string,
    options: any
  ): void {
    const path: TestPath = {
      id,
      steps: [],
      conditions: {},
      data: {},
      expectedOutcome: 'success'
    };
    
    let currentStep = schema.steps[0].id;
    
    while (currentStep) {
      path.steps.push(currentStep);
      
      // Generate data for current step
      const stepData = this.generateStepData(
        schema.steps.find(s => s.id === currentStep)!,
        options.strategy
      );
      
      Object.assign(path.data, stepData);
      
      // Find next step
      const transition = this.selectTransition(
        schema.transitions.filter(t => t.from === currentStep),
        options
      );
      
      if (!transition) break;
      
      currentStep = transition.to;
      
      if (transition.when) {
        path.conditions[currentStep] = transition.when;
      }
    }
    
    this.paths.push(path);
  }
  
  private generateStepData(step: FormStep, strategy: string): any {
    const data: any = {};
    const stepSchema = step.schema as any;
    
    if (stepSchema.properties) {
      Object.entries(stepSchema.properties).forEach(([key, fieldSchema]: [string, any]) => {
        data[key] = this.generateFieldValue(fieldSchema, strategy);
      });
    }
    
    return data;
  }
  
  private generateFieldValue(fieldSchema: any, strategy: string): any {
    switch (fieldSchema.type) {
      case 'string':
        if (fieldSchema.enum) {
          return fieldSchema.enum[0];
        }
        if (fieldSchema.format === 'email') {
          return 'test@example.com';
        }
        if (fieldSchema.format === 'date') {
          return '2024-01-01';
        }
        return 'test value';
        
      case 'number':
        if (strategy === 'boundary') {
          return fieldSchema.minimum || 0;
        }
        return fieldSchema.minimum || 1;
        
      case 'boolean':
        return true;
        
      case 'array':
        return [];
        
      default:
        return null;
    }
  }
  
  private generateDataForCondition(condition: Rule, schema: UnifiedFormSchema): any {
    const data: any = {};
    
    // Simplified - generate data that satisfies condition
    if (condition.op === 'eq') {
      const field = condition.left.replace('$.', '');
      data[field] = condition.right;
    }
    
    return data;
  }
  
  private selectTransition(transitions: any[], options: any): any {
    if (transitions.length === 0) return null;
    
    if (options.choices === 'default') {
      return transitions.find(t => t.default) || transitions[0];
    }
    
    return transitions[0];
  }
  
  private generateBoundaryPaths(schema: UnifiedFormSchema): void {
    // Generate paths with boundary values
    schema.steps.forEach(step => {
      const boundaryData = this.generateBoundaryData(step);
      
      if (Object.keys(boundaryData).length > 0) {
        this.generatePath(schema, `boundary-${step.id}`, {
          strategy: 'boundary',
          stepData: { [step.id]: boundaryData }
        });
      }
    });
  }
  
  private generateBoundaryData(step: FormStep): any {
    const data: any = {};
    const stepSchema = step.schema as any;
    
    if (stepSchema.properties) {
      Object.entries(stepSchema.properties).forEach(([key, fieldSchema]: [string, any]) => {
        if (fieldSchema.type === 'string' && fieldSchema.minLength) {
          data[key] = 'a'.repeat(fieldSchema.minLength);
        } else if (fieldSchema.type === 'number') {
          if (fieldSchema.minimum !== undefined) {
            data[key] = fieldSchema.minimum;
          }
        }
      });
    }
    
    return data;
  }
  
  private generateErrorPaths(schema: UnifiedFormSchema): void {
    // Generate paths that trigger validation errors
    schema.steps.forEach(step => {
      const invalidData = this.generateInvalidData(step);
      
      if (Object.keys(invalidData).length > 0) {
        this.paths.push({
          id: `error-${step.id}`,
          steps: [step.id],
          conditions: {},
          data: invalidData,
          expectedOutcome: 'validation_error'
        });
      }
    });
  }
  
  private generateInvalidData(step: FormStep): any {
    const data: any = {};
    const stepSchema = step.schema as any;
    
    // Generate data that violates required fields
    if (stepSchema.required && stepSchema.required.length > 0) {
      // Leave required fields empty
      stepSchema.required.forEach((field: string) => {
        data[field] = undefined;
      });
    }
    
    return data;
  }
  
  private prunePaths(maxPaths: number): TestPath[] {
    if (this.paths.length <= maxPaths) {
      return this.paths;
    }
    
    // Prioritize paths for pruning
    const prioritized = this.paths.sort((a, b) => {
      // Prioritize: errors > branches > happy path
      const aScore = this.scorePath(a);
      const bScore = this.scorePath(b);
      return bScore - aScore;
    });
    
    return prioritized.slice(0, maxPaths);
  }
  
  private scorePath(path: TestPath): number {
    let score = 0;
    
    // Higher score = higher priority
    if (path.expectedOutcome === 'validation_error') score += 100;
    if (Object.keys(path.conditions).length > 0) score += 50;
    if (path.steps.length > 3) score += 20;
    
    return score;
  }
  
  private reset(): void {
    this.paths = [];
    this.visited.clear();
  }
}
```

### 10.6 Create Migration CLI Tool
```typescript
// src/cli/migrate.ts

#!/usr/bin/env node

import { program } from 'commander';
import { ZodMigrator } from '@/migration/ZodMigrator';
import { ReactFormMigrator } from '@/migration/ReactFormMigrator';
import fs from 'fs-extra';
import path from 'path';

program
  .name('form-migrate')
  .description('Migrate existing forms to unified schema format')
  .version('1.0.0');

program
  .command('zod <input> <output>')
  .description('Migrate Zod schema to unified format')
  .option('-t, --test', 'Generate tests')
  .option('-v, --validate', 'Validate output')
  .option('-i, --interactive', 'Interactive mode')
  .action(async (input, output, options) => {
    try {
      console.log(`📦 Migrating Zod schema: ${input}`);
      
      // Load Zod schema
      const schemaModule = await import(path.resolve(input));
      const zodSchema = schemaModule.default || schemaModule;
      
      // Migrate
      const migrator = new ZodMigrator();
      const result = await migrator.migrate(zodSchema, {
        generateTests: options.test,
        validateOutput: options.validate,
        interactive: options.interactive
      });
      
      if (result.success) {
        // Write output
        await fs.writeJson(output, result.schema, { spaces: 2 });
        
        console.log(`✅ Migration successful!`);
        console.log(`   Fields converted: ${result.stats.fieldsConverted}`);
        console.log(`   Accuracy: ${result.stats.conversionAccuracy}%`);
        
        if (result.warnings.length > 0) {
          console.log(`\n⚠️  Warnings:`);
          result.warnings.forEach(w => {
            console.log(`   - ${w.message}`);
            if (w.suggestion) {
              console.log(`     💡 ${w.suggestion}`);
            }
          });
        }
      } else {
        console.error(`❌ Migration failed:`);
        result.errors.forEach(e => {
          console.error(`   - ${e.message}`);
        });
        process.exit(1);
      }
    } catch (error) {
      console.error('Migration error:', error);
      process.exit(1);
    }
  });

program
  .command('react <input> <output>')
  .description('Migrate React form component to unified format')
  .action(async (input, output, options) => {
    try {
      console.log(`⚛️  Migrating React component: ${input}`);
      
      // Load React component
      const componentCode = await fs.readFile(input, 'utf-8');
      
      // Migrate
      const migrator = new ReactFormMigrator();
      const result = await migrator.migrateComponent(componentCode);
      
      if (result.success) {
        await fs.writeJson(output, result.schema, { spaces: 2 });
        console.log(`✅ Migration successful!`);
      } else {
        console.error(`❌ Migration failed`);
        process.exit(1);
      }
    } catch (error) {
      console.error('Migration error:', error);
      process.exit(1);
    }
  });

program
  .command('test-paths <schema>')
  .description('Generate test paths for a schema')
  .option('-n, --number <n>', 'Number of paths', '10')
  .option('-c, --coverage <type>', 'Coverage type', 'representative')
  .action(async (schemaFile, options) => {
    try {
      console.log(`🧪 Generating test paths for: ${schemaFile}`);
      
      // Load schema
      const schema = await fs.readJson(schemaFile);
      
      // Generate paths
      const generator = new PathGenerator();
      const paths = generator.generatePaths(schema, {
        maxPaths: parseInt(options.number),
        coverage: options.coverage as any
      });
      
      // Display paths
      console.log(`\nGenerated ${paths.length} test paths:\n`);
      
      paths.forEach(path => {
        console.log(`📍 ${path.id}:`);
        console.log(`   Steps: ${path.steps.join(' → ')}`);
        console.log(`   Expected: ${path.expectedOutcome}`);
        
        if (Object.keys(path.conditions).length > 0) {
          console.log(`   Conditions: ${JSON.stringify(path.conditions)}`);
        }
      });
    } catch (error) {
      console.error('Path generation error:', error);
      process.exit(1);
    }
  });

program.parse();
```

## Test Cases

### Migration Tests
```typescript
describe('ZodMigrator', () => {
  let migrator: ZodMigrator;
  
  beforeEach(() => {
    migrator = new ZodMigrator();
  });
  
  it('should migrate simple Zod schema', async () => {
    const zodSchema = z.object({
      name: z.string().min(1).max(50),
      email: z.string().email(),
      age: z.number().min(18).max(100)
    });
    
    const result = await migrator.migrate(zodSchema);
    
    expect(result.success).toBe(true);
    expect(result.schema?.steps).toHaveLength(1);
    expect(result.stats.fieldsConverted).toBe(3);
  });
  
  it('should handle complex validations', async () => {
    const zodSchema = z.object({
      password: z.string()
        .min(8)
        .regex(/[A-Z]/)
        .regex(/[0-9]/),
      confirmPassword: z.string()
    }).refine(data => data.password === data.confirmPassword, {
      message: 'Passwords must match'
    });
    
    const result = await migrator.migrate(zodSchema);
    
    expect(result.warnings).toContainEqual(
      expect.objectContaining({
        type: 'complex_type'
      })
    );
  });
});

describe('PathGenerator', () => {
  let generator: PathGenerator;
  
  beforeEach(() => {
    generator = new PathGenerator();
  });
  
  it('should generate minimal paths', () => {
    const schema = createTestSchema();
    
    const paths = generator.generatePaths(schema, {
      coverage: 'minimal'
    });
    
    expect(paths.length).toBeGreaterThanOrEqual(1);
    expect(paths[0].expectedOutcome).toBe('success');
  });
  
  it('should generate boundary value paths', () => {
    const schema = createTestSchema();
    
    const paths = generator.generatePaths(schema, {
      coverage: 'representative'
    });
    
    const boundaryPath = paths.find(p => p.id.includes('boundary'));
    expect(boundaryPath).toBeDefined();
  });
});
```

## Success Criteria
- ✅ Zod schemas successfully migrated with >80% accuracy
- ✅ React components parsed and converted
- ✅ Field mappings tracked for validation
- ✅ Intelligent step grouping implemented
- ✅ Test paths generated with multiple strategies
- ✅ CLI tool functional and user-friendly
- ✅ Migration warnings and suggestions provided
- ✅ Generated schemas pass validation

## Implementation Notes

### Migration Strategy
- Start with simple forms first
- Manual review for complex logic
- Preserve original validation rules
- Generate comprehensive tests
- Document all transformations

### Testing Approach
- Unit test each migrator
- Integration tests with real schemas
- Validate migrated schemas
- Compare behavior before/after
- Performance test large forms

### Error Recovery
- Partial migration on errors
- Clear error reporting
- Rollback capability
- Manual override options
- Migration versioning

## Next Steps
With migration tools complete:
1. Create demo multi-step form (Step 11)
2. Build migration wizard UI
3. Add schema diff tool
4. Create validation comparison reports
5. Build automated migration pipeline