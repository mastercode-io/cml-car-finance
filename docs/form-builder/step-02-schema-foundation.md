# Step 2: Schema Foundation & Types

## Step Description
Define the complete TypeScript type system for the unified JSON schema structure, including validation, UI, flow, and computed field definitions. This step establishes the contract that all other components will depend on.

## Prerequisites
- Step 1 (Project Setup) completed
- TypeScript configured with strict mode
- JSON Schema 2020-12 specification familiarity
- Understanding of the PRD schema requirements

## Detailed To-Do List

### 2.1 Core Schema Type Definitions
```typescript
// src/types/schema.types.ts

export interface UnifiedFormSchema {
  $id: string;
  version: string;
  extends?: string[];
  metadata: FormMetadata;
  definitions: Record<string, JSONSchema>;
  steps: FormStep[];
  transitions: StepTransition[];
  ui: UIDefinition;
  computed?: ComputedField[];
  dataSources?: Record<string, DataSource>;
  validation?: ValidationConfig;
}

export interface FormMetadata {
  title: string;
  description: string;
  sensitivity: 'low' | 'medium' | 'high';
  retainHidden?: boolean;
  allowAutosave?: boolean;
  timeout?: number;
  tags?: string[];
  owner?: string;
  lastModified?: string;
}

export interface FormStep {
  id: string;
  title: string;
  description?: string;
  schema: JSONSchema | { $ref: string };
  visibleWhen?: Rule;
  timeout?: number;
  helpText?: string;
}
```

### 2.2 Rule DSL Type System
```typescript
// src/types/rules.types.ts

export type Rule = 
  | ComparisonRule
  | LogicalRule
  | CustomRule;

export interface ComparisonRule {
  op: 'eq' | 'neq' | 'gt' | 'lt' | 'gte' | 'lte' | 'in' | 'regex';
  left: string;  // JSONPath expression
  right: unknown;
}

export interface LogicalRule {
  op: 'and' | 'or' | 'not';
  args: Rule[];
}

export interface CustomRule {
  op: 'custom';
  fn: string;
  args: unknown[];
}

export interface StepTransition {
  from: string;
  to: string;
  when?: Rule;
  default?: boolean;
  guard?: string;  // XState guard reference
}
```

### 2.3 UI Widget Type Definitions
```typescript
// src/types/ui.types.ts

export interface UIDefinition {
  widgets: Record<string, WidgetConfig>;
  layout?: LayoutConfig;
  theme?: ThemeConfig;
}

export interface WidgetConfig {
  component: WidgetType;
  label: string;
  placeholder?: string;
  helpText?: string;
  disabled?: boolean;
  readOnly?: boolean;
  className?: string;
  styleWhen?: Array<{
    condition: Rule;
    className: string;
  }>;
  validation?: {
    pattern?: string;
    message?: string;
    async?: boolean;
  };
  optionsFrom?: string;  // DataSource reference
  mask?: string;
  format?: string;
}

export type WidgetType = 
  | 'Text'
  | 'Number'
  | 'TextArea'
  | 'Select'
  | 'RadioGroup'
  | 'Checkbox'
  | 'Date'
  | 'FileUpload'
  | 'Repeater'
  | 'Rating'
  | 'Slider'
  | 'Currency'
  | 'Percentage'
  | 'Phone'
  | 'Email'
  | 'Postcode'
  | 'IBAN'
  | 'ColorPicker'
  | 'Custom';
```

### 2.4 Computed Fields & Data Sources
```typescript
// src/types/computed.types.ts

export interface ComputedField {
  path: string;  // JSONPath where to store result
  expr: string;  // Expression to evaluate
  dependsOn: string[];  // Field dependencies
  round?: number;
  recompute?: 'onChange' | 'onBlur' | 'onSubmit';
  cache?: boolean;
  fallback?: unknown;
}

export interface DataSource {
  type: 'http' | 'static' | 'function';
  url?: string;
  method?: 'GET' | 'POST';
  headers?: Record<string, string>;
  cache?: 'none' | 'swr' | 'persistent';
  ttlMs?: number;
  retries?: number;
  fallback?: unknown[];
  transform?: string;  // JSONPath or function name
}
```

### 2.5 JSON Schema Extensions
```typescript
// src/types/json-schema.types.ts

export interface JSONSchema {
  type?: 'object' | 'array' | 'string' | 'number' | 'boolean' | 'null';
  properties?: Record<string, JSONSchema>;
  required?: string[];
  items?: JSONSchema;
  enum?: unknown[];
  const?: unknown;
  
  // String validations
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  format?: string;
  
  // Number validations
  minimum?: number;
  maximum?: number;
  exclusiveMinimum?: number;
  exclusiveMaximum?: number;
  multipleOf?: number;
  
  // Array validations
  minItems?: number;
  maxItems?: number;
  uniqueItems?: boolean;
  
  // Object validations
  minProperties?: number;
  maxProperties?: number;
  additionalProperties?: boolean | JSONSchema;
  
  // Logical operators
  allOf?: JSONSchema[];
  anyOf?: JSONSchema[];
  oneOf?: JSONSchema[];
  not?: JSONSchema;
  
  // References
  $ref?: string;
  $id?: string;
  
  // Custom extensions
  'x-visibility'?: Rule;
  'x-compute'?: string;
  'x-datasource'?: string;
}
```

### 2.6 Schema Validation Utilities
```typescript
// src/utils/schema-validator.ts

import Ajv from 'ajv';
import addFormats from 'ajv-formats';

export class SchemaValidator {
  private ajv: Ajv;
  
  constructor() {
    this.ajv = new Ajv({
      allErrors: true,
      verbose: true,
      strict: true,
      validateFormats: true
    });
    
    addFormats(this.ajv);
    this.registerCustomFormats();
    this.registerCustomKeywords();
  }
  
  private registerCustomFormats() {
    // Phone number format
    this.ajv.addFormat('phone', {
      validate: (data: string) => 
        /^\+?[1-9]\d{1,14}$/.test(data)
    });
    
    // Postcode format (UK)
    this.ajv.addFormat('postcode', {
      validate: (data: string) =>
        /^[A-Z]{1,2}[0-9]{1,2}[A-Z]?\s?[0-9][A-Z]{2}$/i.test(data)
    });
    
    // IBAN format
    this.ajv.addFormat('iban', {
      validate: (data: string) =>
        /^[A-Z]{2}[0-9]{2}[A-Z0-9]{4}[0-9]{7}([A-Z0-9]?){0,16}$/.test(data)
    });
    
    // Currency format
    this.ajv.addFormat('currency', {
      validate: (data: string) =>
        /^\d+(\.\d{2})?$/.test(data)
    });
  }
  
  private registerCustomKeywords() {
    // Conditional required
    this.ajv.addKeyword({
      keyword: 'requiredWhen',
      type: 'object',
      schemaType: 'object',
      compile: function(schema) {
        return function validate(data, context) {
          // Implementation of conditional required
          return true;
        };
      }
    });
  }
  
  validateSchema(schema: UnifiedFormSchema): ValidationResult {
    // Validate the schema structure itself
    const valid = this.ajv.validate(UNIFIED_SCHEMA_META, schema);
    return {
      valid,
      errors: this.ajv.errors || []
    };
  }
  
  compileSchema(schema: JSONSchema): CompiledSchema {
    return this.ajv.compile(schema);
  }
}
```

### 2.7 Schema Composition Engine
```typescript
// src/core/schema-composer.ts

export class SchemaComposer {
  private schemas: Map<string, UnifiedFormSchema> = new Map();
  
  async loadSchema(id: string): Promise<UnifiedFormSchema> {
    // Load from CDN or local
    const response = await fetch(`/schemas/${id}.json`);
    const schema = await response.json();
    this.schemas.set(id, schema);
    return schema;
  }
  
  compose(schema: UnifiedFormSchema): UnifiedFormSchema {
    if (!schema.extends) return schema;
    
    // Resolve extends in order
    const base = this.mergeSchemas(
      schema.extends.map(id => this.schemas.get(id)!)
    );
    
    // Apply local overrides
    return this.mergeWithOverrides(base, schema);
  }
  
  private mergeSchemas(schemas: UnifiedFormSchema[]): UnifiedFormSchema {
    // Deep merge with conflict detection
    return schemas.reduce((acc, schema) => {
      return this.deepMerge(acc, schema);
    });
  }
  
  private mergeWithOverrides(
    base: UnifiedFormSchema, 
    overrides: Partial<UnifiedFormSchema>
  ): UnifiedFormSchema {
    // Handle explicit overrides with conflict resolution
    return { ...base, ...overrides };
  }
  
  private deepMerge(target: any, source: any): any {
    // Implementation of deep merge with precedence rules
    // base < environment < local
    return merged;
  }
}
```

### 2.8 Schema Version Management
```typescript
// src/core/schema-versioning.ts

export interface SchemaVersion {
  version: string;
  schema: UnifiedFormSchema;
  migrations?: Migration[];
  deprecated?: boolean;
  deprecationDate?: string;
  migrateTo?: string;
}

export interface Migration {
  from: string;
  to: string;
  transform: (data: any) => any;
  description: string;
}

export class SchemaVersionManager {
  private versions: Map<string, SchemaVersion[]> = new Map();
  
  registerVersion(id: string, version: SchemaVersion) {
    const versions = this.versions.get(id) || [];
    versions.push(version);
    versions.sort((a, b) => 
      this.compareVersions(a.version, b.version)
    );
    this.versions.set(id, versions);
  }
  
  getLatestVersion(id: string): SchemaVersion | undefined {
    const versions = this.versions.get(id);
    return versions?.[versions.length - 1];
  }
  
  migrateData(
    id: string, 
    data: any, 
    fromVersion: string, 
    toVersion: string
  ): any {
    // Apply migrations in sequence
    const migrations = this.getMigrationPath(id, fromVersion, toVersion);
    return migrations.reduce((acc, migration) => 
      migration.transform(acc), data
    );
  }
  
  private compareVersions(a: string, b: string): number {
    // Semver comparison
    const [aMajor, aMinor, aPatch] = a.split('.').map(Number);
    const [bMajor, bMinor, bPatch] = b.split('.').map(Number);
    
    if (aMajor !== bMajor) return aMajor - bMajor;
    if (aMinor !== bMinor) return aMinor - bMinor;
    return aPatch - bPatch;
  }
}
```

## Test Cases

### Schema Validation Tests
```typescript
describe('Schema Validation', () => {
  it('should validate a complete unified schema', () => {
    const schema: UnifiedFormSchema = {
      $id: 'test-form',
      version: '1.0.0',
      metadata: {
        title: 'Test Form',
        sensitivity: 'low'
      },
      // ... complete schema
    };
    
    const validator = new SchemaValidator();
    const result = validator.validateSchema(schema);
    expect(result.valid).toBe(true);
  });
  
  it('should detect schema conflicts during composition', () => {
    // Test conflict detection
  });
  
  it('should merge schemas with correct precedence', () => {
    // Test precedence: base < env < local
  });
});
```

### Type Safety Tests
```typescript
describe('Type Safety', () => {
  it('should enforce widget type constraints', () => {
    // Compile-time type checking tests
  });
  
  it('should validate rule DSL structure', () => {
    // Rule type validation
  });
});
```

## Success Criteria
- ✅ All TypeScript interfaces compile without errors
- ✅ Schema validator correctly validates test schemas
- ✅ Schema composition handles extends correctly
- ✅ Custom formats and keywords registered in AJV
- ✅ Version management supports semver comparison
- ✅ Migration system can transform between versions
- ✅ Type exports are properly organized and documented

## Implementation Notes

### Type Safety Best Practices
- Use discriminated unions for Rule types
- Leverage TypeScript's strict null checks
- Create branded types for IDs and versions
- Use const assertions for literal types

### Performance Considerations
- Cache compiled schemas for reuse
- Lazy load schema definitions
- Use WeakMap for schema metadata
- Implement schema validation memoization

### Schema Design Patterns
- Keep schemas DRY with $ref and definitions
- Use composition over duplication
- Version schemas from day one
- Document breaking changes clearly

## Next Steps
With the schema foundation in place:
1. Build the field registry and components (Step 3)
2. Create schema authoring utilities
3. Implement schema validation CLI tool
4. Set up schema documentation generator
5. Begin work on validation engine