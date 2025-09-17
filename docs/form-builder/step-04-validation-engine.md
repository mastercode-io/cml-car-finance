# Step 4: Validation Engine

## Step Description
Implement the complete validation engine using AJV for JSON Schema validation, create custom formats and keywords, build the React Hook Form resolver, and establish per-step validation with performance optimization.

## Prerequisites
- Step 3 (Field Registry) completed
- AJV and ajv-formats installed
- React Hook Form configured
- Schema type definitions available
- Custom format requirements defined

## Detailed To-Do List

### 4.1 AJV Configuration & Setup
```typescript
// src/validation/ajv-setup.ts

import Ajv, { ErrorObject, ValidateFunction } from 'ajv';
import addFormats from 'ajv-formats';
import ajvErrors from 'ajv-errors';
import ajvKeywords from 'ajv-keywords';

export class ValidationEngine {
  private ajv: Ajv;
  private compiledSchemas: Map<string, ValidateFunction> = new Map();
  private performanceMetrics: Map<string, number[]> = new Map();
  
  constructor() {
    this.ajv = new Ajv({
      allErrors: true,
      verbose: true,
      strict: true,
      validateFormats: true,
      coerceTypes: true,
      useDefaults: true,
      removeAdditional: 'failing',
      $data: true, // Enable data references
      messages: true // Enable custom error messages
    });
    
    // Add standard formats
    addFormats(this.ajv);
    
    // Add ajv-keywords for additional validation
    ajvKeywords(this.ajv, [
      'typeof',
      'instanceof',
      'range',
      'exclusiveRange',
      'uniqueItemProperties',
      'regexp',
      'dynamicDefaults',
      'transform'
    ]);
    
    // Add custom error messages support
    ajvErrors(this.ajv);
    
    // Register custom formats
    this.registerCustomFormats();
    
    // Register custom keywords
    this.registerCustomKeywords();
  }
  
  private registerCustomFormats(): void {
    // UK Postcode
    this.ajv.addFormat('uk-postcode', {
      type: 'string',
      validate: (data: string) => {
        const pattern = /^[A-Z]{1,2}[0-9][A-Z0-9]?\s?[0-9][A-Z]{2}$/i;
        return pattern.test(data.trim());
      }
    });
    
    // US Zip Code
    this.ajv.addFormat('us-zip', {
      type: 'string',
      validate: (data: string) => {
        return /^\d{5}(-\d{4})?$/.test(data);
      }
    });
    
    // Phone Number (E.164 format)
    this.ajv.addFormat('phone', {
      type: 'string',
      validate: (data: string) => {
        return /^\+[1-9]\d{1,14}$/.test(data);
      }
    });
    
    // IBAN
    this.ajv.addFormat('iban', {
      type: 'string',
      validate: (data: string) => {
        const iban = data.replace(/\s/g, '').toUpperCase();
        if (!/^[A-Z]{2}[0-9]{2}[A-Z0-9]+$/.test(iban)) return false;
        
        // IBAN checksum validation
        const rearranged = iban.slice(4) + iban.slice(0, 4);
        const numeric = rearranged.replace(/[A-Z]/g, (char) => 
          String(char.charCodeAt(0) - 55)
        );
        
        return BigInt(numeric) % 97n === 1n;
      }
    });
    
    // Currency
    this.ajv.addFormat('currency', {
      type: 'number',
      validate: (data: number) => {
        return Number.isFinite(data) && data >= 0;
      }
    });
    
    // Credit Card
    this.ajv.addFormat('credit-card', {
      type: 'string',
      validate: (data: string) => {
        const cleaned = data.replace(/\D/g, '');
        if (cleaned.length < 13 || cleaned.length > 19) return false;
        
        // Luhn algorithm
        let sum = 0;
        let isEven = false;
        
        for (let i = cleaned.length - 1; i >= 0; i--) {
          let digit = parseInt(cleaned[i], 10);
          
          if (isEven) {
            digit *= 2;
            if (digit > 9) digit -= 9;
          }
          
          sum += digit;
          isEven = !isEven;
        }
        
        return sum % 10 === 0;
      }
    });
  }
  
  private registerCustomKeywords(): void {
    // Conditional required
    this.ajv.addKeyword({
      keyword: 'requiredWhen',
      type: 'object',
      schemaType: 'object',
      compile: function(schema: any) {
        return function validate(data: any, ctx: any) {
          const condition = evaluateRule(schema.condition, data);
          if (condition) {
            for (const field of schema.fields) {
              if (data[field] === undefined || data[field] === null) {
                validate.errors = [{
                  instancePath: '/' + field,
                  schemaPath: '#/requiredWhen',
                  keyword: 'requiredWhen',
                  params: { missingProperty: field },
                  message: `${field} is required when condition is met`
                }];
                return false;
              }
            }
          }
          return true;
        };
      }
    });
    
    // Cross-field validation
    this.ajv.addKeyword({
      keyword: 'crossField',
      type: 'object',
      schemaType: 'object',
      compile: function(schema: any) {
        return function validate(data: any) {
          const { field1, field2, operator } = schema;
          const val1 = data[field1];
          const val2 = data[field2];
          
          switch (operator) {
            case 'equals':
              return val1 === val2;
            case 'notEquals':
              return val1 !== val2;
            case 'greaterThan':
              return val1 > val2;
            case 'lessThan':
              return val1 < val2;
            default:
              return true;
          }
        };
      }
    });
    
    // Async validation
    this.ajv.addKeyword({
      keyword: 'asyncValidate',
      async: true,
      type: 'string',
      schemaType: 'object',
      compile: function(schema: any) {
        return async function validate(data: any) {
          const { endpoint, method = 'POST', timeout = 2000 } = schema;
          
          try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), timeout);
            
            const response = await fetch(endpoint, {
              method,
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ value: data }),
              signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            const result = await response.json();
            
            if (!result.valid) {
              validate.errors = [{
                instancePath: '',
                schemaPath: '#/asyncValidate',
                keyword: 'asyncValidate',
                message: result.message || 'Async validation failed'
              }];
              return false;
            }
            
            return true;
          } catch (error) {
            // On error, pass validation but log
            console.error('Async validation error:', error);
            return true;
          }
        };
      }
    });
  }
  
  compile(schema: JSONSchema): ValidateFunction {
    const schemaId = schema.$id || JSON.stringify(schema);
    
    if (this.compiledSchemas.has(schemaId)) {
      return this.compiledSchemas.get(schemaId)!;
    }
    
    const validate = this.ajv.compile(schema);
    this.compiledSchemas.set(schemaId, validate);
    
    return validate;
  }
  
  async validate(
    schema: JSONSchema, 
    data: any,
    options?: ValidationOptions
  ): Promise<ValidationResult> {
    const startTime = performance.now();
    
    try {
      const validate = this.compile(schema);
      const valid = await validate(data);
      
      const duration = performance.now() - startTime;
      this.trackPerformance(schema.$id || 'unknown', duration);
      
      if (options?.timeout && duration > options.timeout) {
        console.warn(`Validation exceeded timeout: ${duration}ms`);
      }
      
      return {
        valid,
        errors: validate.errors ? this.formatErrors(validate.errors) : [],
        duration
      };
    } catch (error) {
      return {
        valid: false,
        errors: [{
          path: '',
          message: error instanceof Error ? error.message : 'Validation failed'
        }],
        duration: performance.now() - startTime
      };
    }
  }
  
  private formatErrors(errors: ErrorObject[]): ValidationError[] {
    return errors.map(error => ({
      path: error.instancePath,
      property: error.params?.missingProperty || 
                error.instancePath.split('/').pop() || '',
      message: this.getErrorMessage(error),
      keyword: error.keyword,
      params: error.params
    }));
  }
  
  private getErrorMessage(error: ErrorObject): string {
    // Custom error messages based on keyword
    const customMessages: Record<string, (e: ErrorObject) => string> = {
      required: (e) => `${e.params.missingProperty} is required`,
      minLength: (e) => `Must be at least ${e.params.limit} characters`,
      maxLength: (e) => `Must be at most ${e.params.limit} characters`,
      minimum: (e) => `Must be at least ${e.params.limit}`,
      maximum: (e) => `Must be at most ${e.params.limit}`,
      pattern: (e) => 'Invalid format',
      format: (e) => `Invalid ${e.params.format} format`,
      enum: (e) => `Must be one of: ${e.params.allowedValues.join(', ')}`,
      type: (e) => `Must be a ${e.params.type}`
    };
    
    const messageGenerator = customMessages[error.keyword];
    return messageGenerator ? messageGenerator(error) : error.message || 'Validation failed';
  }
  
  private trackPerformance(schemaId: string, duration: number): void {
    const metrics = this.performanceMetrics.get(schemaId) || [];
    metrics.push(duration);
    
    // Keep last 100 measurements
    if (metrics.length > 100) {
      metrics.shift();
    }
    
    this.performanceMetrics.set(schemaId, metrics);
  }
  
  getPerformanceMetrics(schemaId: string): PerformanceMetrics {
    const metrics = this.performanceMetrics.get(schemaId) || [];
    
    if (metrics.length === 0) {
      return { p50: 0, p95: 0, p99: 0, avg: 0 };
    }
    
    const sorted = [...metrics].sort((a, b) => a - b);
    
    return {
      p50: sorted[Math.floor(sorted.length * 0.5)],
      p95: sorted[Math.floor(sorted.length * 0.95)],
      p99: sorted[Math.floor(sorted.length * 0.99)],
      avg: metrics.reduce((a, b) => a + b, 0) / metrics.length
    };
  }
}
```

### 4.2 React Hook Form Resolver
```typescript
// src/validation/rhf-resolver.ts

import { Resolver, ResolverResult, FieldErrors } from 'react-hook-form';
import { ValidationEngine } from './ajv-setup';

export function createAjvResolver(
  schema: JSONSchema,
  validationEngine?: ValidationEngine
): Resolver {
  const engine = validationEngine || new ValidationEngine();
  
  return async (values, context, options) => {
    const result = await engine.validate(schema, values, {
      timeout: 50 // 50ms timeout for p95 target
    });
    
    if (result.valid) {
      return {
        values,
        errors: {}
      };
    }
    
    // Convert AJV errors to React Hook Form errors
    const errors: FieldErrors = {};
    
    for (const error of result.errors) {
      const path = error.path.replace(/^\//, '').replace(/\//g, '.');
      const fieldPath = path || error.property;
      
      if (fieldPath) {
        set(errors, fieldPath, {
          type: error.keyword,
          message: error.message
        });
      }
    }
    
    return {
      values: {},
      errors
    };
  };
}

// Helper function to set nested object values
function set(obj: any, path: string, value: any): void {
  const keys = path.split('.');
  let current = obj;
  
  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];
    if (!current[key]) {
      current[key] = {};
    }
    current = current[key];
  }
  
  current[keys[keys.length - 1]] = value;
}
```

### 4.3 Per-Step Validation
```typescript
// src/validation/step-validator.ts

export class StepValidator {
  private engine: ValidationEngine;
  private stepSchemas: Map<string, JSONSchema> = new Map();
  
  constructor(engine?: ValidationEngine) {
    this.engine = engine || new ValidationEngine();
  }
  
  registerStep(stepId: string, schema: JSONSchema): void {
    this.stepSchemas.set(stepId, schema);
  }
  
  async validateStep(
    stepId: string, 
    data: any,
    options?: StepValidationOptions
  ): Promise<StepValidationResult> {
    const schema = this.stepSchemas.get(stepId);
    
    if (!schema) {
      throw new Error(`No schema found for step: ${stepId}`);
    }
    
    // Extract only the data relevant to this step
    const stepData = options?.fullData ? 
      extractStepData(data, schema) : data;
    
    const result = await this.engine.validate(schema, stepData, {
      timeout: options?.timeout || 50
    });
    
    // Check if should block progression
    const blockProgression = options?.blockOnError && !result.valid;
    
    return {
      ...result,
      stepId,
      canProceed: !blockProgression,
      warnings: this.extractWarnings(result.errors)
    };
  }
  
  async validateAllSteps(
    data: any
  ): Promise<Map<string, StepValidationResult>> {
    const results = new Map<string, StepValidationResult>();
    
    for (const [stepId, schema] of this.stepSchemas) {
      const result = await this.validateStep(stepId, data, {
        fullData: true
      });
      results.set(stepId, result);
    }
    
    return results;
  }
  
  private extractWarnings(errors: ValidationError[]): ValidationError[] {
    // Separate warnings from errors based on severity
    return errors.filter(e => 
      e.keyword === 'warning' || 
      e.params?.severity === 'warning'
    );
  }
}

function extractStepData(fullData: any, schema: JSONSchema): any {
  // Extract only properties defined in the step schema
  const stepData: any = {};
  
  if (schema.properties) {
    for (const key of Object.keys(schema.properties)) {
      if (fullData.hasOwnProperty(key)) {
        stepData[key] = fullData[key];
      }
    }
  }
  
  return stepData;
}
```

### 4.4 Validation Worker for Heavy Operations
```typescript
// src/validation/validation.worker.ts

import { ValidationEngine } from './ajv-setup';

let engine: ValidationEngine | null = null;

self.addEventListener('message', async (event) => {
  const { type, payload } = event.data;
  
  switch (type) {
    case 'INIT':
      engine = new ValidationEngine();
      self.postMessage({ type: 'READY' });
      break;
      
    case 'VALIDATE':
      if (!engine) {
        self.postMessage({
          type: 'ERROR',
          error: 'Validation engine not initialized'
        });
        return;
      }
      
      try {
        const result = await engine.validate(
          payload.schema,
          payload.data,
          payload.options
        );
        
        self.postMessage({
          type: 'VALIDATION_RESULT',
          result
        });
      } catch (error) {
        self.postMessage({
          type: 'ERROR',
          error: error instanceof Error ? error.message : 'Validation failed'
        });
      }
      break;
      
    case 'COMPILE':
      if (!engine) {
        self.postMessage({
          type: 'ERROR',
          error: 'Validation engine not initialized'
        });
        return;
      }
      
      try {
        engine.compile(payload.schema);
        self.postMessage({ type: 'COMPILED' });
      } catch (error) {
        self.postMessage({
          type: 'ERROR',
          error: error instanceof Error ? error.message : 'Compilation failed'
        });
      }
      break;
  }
});

// src/validation/worker-client.ts

export class ValidationWorkerClient {
  private worker: Worker | null = null;
  private ready: Promise<void>;
  private resolveReady: () => void = () => {};
  
  constructor() {
    this.ready = new Promise(resolve => {
      this.resolveReady = resolve;
    });
    
    this.initWorker();
  }
  
  private initWorker(): void {
    this.worker = new Worker(
      new URL('./validation.worker.ts', import.meta.url),
      { type: 'module' }
    );
    
    this.worker.addEventListener('message', (event) => {
      if (event.data.type === 'READY') {
        this.resolveReady();
      }
    });
    
    this.worker.postMessage({ type: 'INIT' });
  }
  
  async validate(
    schema: JSONSchema,
    data: any,
    options?: ValidationOptions
  ): Promise<ValidationResult> {
    await this.ready;
    
    return new Promise((resolve, reject) => {
      if (!this.worker) {
        reject(new Error('Worker not initialized'));
        return;
      }
      
      const handler = (event: MessageEvent) => {
        if (event.data.type === 'VALIDATION_RESULT') {
          this.worker!.removeEventListener('message', handler);
          resolve(event.data.result);
        } else if (event.data.type === 'ERROR') {
          this.worker!.removeEventListener('message', handler);
          reject(new Error(event.data.error));
        }
      };
      
      this.worker.addEventListener('message', handler);
      
      this.worker.postMessage({
        type: 'VALIDATE',
        payload: { schema, data, options }
      });
    });
  }
  
  terminate(): void {
    this.worker?.terminate();
    this.worker = null;
  }
}
```

### 4.5 Validation Hooks
```typescript
// src/hooks/useValidation.ts

export function useStepValidation(
  stepId: string,
  schema: JSONSchema
): StepValidationHook {
  const [validationState, setValidationState] = useState<ValidationState>({
    isValidating: false,
    errors: [],
    isValid: true
  });
  
  const validatorRef = useRef<StepValidator>();
  const workerRef = useRef<ValidationWorkerClient>();
  
  useEffect(() => {
    validatorRef.current = new StepValidator();
    validatorRef.current.registerStep(stepId, schema);
    
    // Initialize worker for heavy validations
    if (shouldUseWorker(schema)) {
      workerRef.current = new ValidationWorkerClient();
    }
    
    return () => {
      workerRef.current?.terminate();
    };
  }, [stepId, schema]);
  
  const validate = useCallback(async (data: any): Promise<boolean> => {
    setValidationState(prev => ({ ...prev, isValidating: true }));
    
    try {
      const validator = shouldUseWorker(schema) ? 
        workerRef.current : validatorRef.current;
      
      const result = await validator!.validateStep(stepId, data);
      
      setValidationState({
        isValidating: false,
        errors: result.errors,
        isValid: result.valid
      });
      
      return result.valid;
    } catch (error) {
      setValidationState({
        isValidating: false,
        errors: [{
          path: '',
          message: 'Validation failed'
        }],
        isValid: false
      });
      
      return false;
    }
  }, [stepId, schema]);
  
  const clearErrors = useCallback(() => {
    setValidationState({
      isValidating: false,
      errors: [],
      isValid: true
    });
  }, []);
  
  return {
    ...validationState,
    validate,
    clearErrors
  };
}

function shouldUseWorker(schema: JSONSchema): boolean {
  // Use worker for complex schemas
  const propertyCount = Object.keys(schema.properties || {}).length;
  const hasAsyncValidation = JSON.stringify(schema).includes('asyncValidate');
  const hasComplexRules = JSON.stringify(schema).includes('allOf') ||
                         JSON.stringify(schema).includes('anyOf');
  
  return propertyCount > 20 || hasAsyncValidation || hasComplexRules;
}
```

## Test Cases

### Validation Engine Tests
```typescript
describe('Validation Engine', () => {
  let engine: ValidationEngine;
  
  beforeEach(() => {
    engine = new ValidationEngine();
  });
  
  it('should validate required fields', async () => {
    const schema = {
      type: 'object',
      properties: {
        name: { type: 'string' },
        email: { type: 'string', format: 'email' }
      },
      required: ['name', 'email']
    };
    
    const result = await engine.validate(schema, {
      name: 'John'
    });
    
    expect(result.valid).toBe(false);
    expect(result.errors).toContainEqual(
      expect.objectContaining({
        property: 'email',
        message: 'email is required'
      })
    );
  });
  
  it('should validate custom formats', async () => {
    const schema = {
      type: 'object',
      properties: {
        phone: { type: 'string', format: 'phone' }
      }
    };
    
    const validResult = await engine.validate(schema, {
      phone: '+14155551234'
    });
    expect(validResult.valid).toBe(true);
    
    const invalidResult = await engine.validate(schema, {
      phone: '123'
    });
    expect(invalidResult.valid).toBe(false);
  });
  
  it('should handle async validation', async () => {
    const schema = {
      type: 'object',
      properties: {
        username: {
          type: 'string',
          asyncValidate: {
            endpoint: '/api/validate/username',
            timeout: 1000
          }
        }
      }
    };
    
    // Mock fetch
    global.fetch = jest.fn().mockResolvedValue({
      json: async () => ({ valid: true })
    });
    
    const result = await engine.validate(schema, {
      username: 'testuser'
    });
    
    expect(result.valid).toBe(true);
  });
  
  it('should meet performance targets', async () => {
    const schema = {
      type: 'object',
      properties: {
        field1: { type: 'string' },
        field2: { type: 'number' },
        field3: { type: 'boolean' }
      }
    };
    
    const data = {
      field1: 'test',
      field2: 123,
      field3: true
    };
    
    const result = await engine.validate(schema, data);
    
    expect(result.duration).toBeLessThan(50); // p95 target
  });
});
```

### Step Validation Tests
```typescript
describe('Step Validator', () => {
  it('should validate individual steps', async () => {
    const validator = new StepValidator();
    
    validator.registerStep('personal', {
      type: 'object',
      properties: {
        firstName: { type: 'string', minLength: 1 },
        lastName: { type: 'string', minLength: 1 }
      },
      required: ['firstName', 'lastName']
    });
    
    const result = await validator.validateStep('personal', {
      firstName: 'John'
    });
    
    expect(result.valid).toBe(false);
    expect(result.canProceed).toBe(true); // Default doesn't block
  });
  
  it('should block progression when configured', async () => {
    const validator = new StepValidator();
    
    validator.registerStep('step1', {
      type: 'object',
      properties: {
        required: { type: 'string' }
      },
      required: ['required']
    });
    
    const result = await validator.validateStep('step1', {}, {
      blockOnError: true
    });
    
    expect(result.canProceed).toBe(false);
  });
});
```

## Success Criteria
- ✅ All custom formats registered and working
- ✅ Custom keywords functional (requiredWhen, crossField, asyncValidate)
- ✅ React Hook Form resolver integration complete
- ✅ Per-step validation with <50ms p95 performance
- ✅ Worker-based validation for complex schemas
- ✅ Performance metrics tracking implemented
- ✅ Error messages user-friendly and customizable

## Implementation Notes

### Performance Optimization
- Compile schemas once and cache
- Use workers for schemas with >20 fields
- Implement validation debouncing
- Track and monitor p95 metrics

### Error Handling
- Graceful degradation for async validation failures
- Timeout handling for long-running validations
- Clear, actionable error messages
- Support for warnings vs errors

### Security Considerations
- Sanitize error messages to prevent XSS
- Validate async endpoints are allowlisted
- Implement rate limiting for async validations
- Never expose internal schema structure in errors

## Next Steps
With validation engine complete:
1. Implement rule engine and branching logic (Step 5)
2. Create validation performance dashboard
3. Build validation testing utilities
4. Document custom format/keyword APIs
5. Set up validation regression tests