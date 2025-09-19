# Form Builder Remediation Plan

## Overview
6 of 11 steps are failing due to missing dependencies, incomplete implementations, and configuration issues. This plan provides a systematic approach to fix all issues and prepare for testing.

## Priority Order
1. **Critical Infrastructure** (Step 1) - Unblocks everything
2. **Missing Dependencies** (Steps 8-10) - Quick fixes
3. **Field Registry** (Step 3) - Core functionality gap
4. **XState Integration** (Step 5) - Complete placeholders
5. **Demo Form** (Step 11) - Final validation

---

## Phase 1: Fix Infrastructure & Dependencies (Day 1)

### 1.1 Install Missing Development Tools
```bash
# Install missing dev dependencies
npm install --save-dev \
  eslint \
  @typescript-eslint/eslint-plugin \
  @typescript-eslint/parser \
  jest \
  @types/jest \
  ts-jest \
  @testing-library/react \
  @testing-library/jest-dom \
  @playwright/test \
  size-limit \
  @size-limit/preset-big-lib

# Install missing runtime dependencies for Steps 8-10
npm install --save \
  swr \
  expr-eval \
  jsonpath \
  web-vitals \
  @babel/parser \
  @babel/traverse \
  zod-to-json-schema

# Install missing type definitions
npm install --save-dev \
  @types/jsonpath \
  @types/babel__traverse
```

### 1.2 Configure ESLint
```javascript
// .eslintrc.js
module.exports = {
  root: true,
  extends: [
    'next/core-web-vitals',
    'plugin:@typescript-eslint/recommended'
  ],
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  rules: {
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }]
  },
  ignorePatterns: ['dist', 'node_modules', '.next']
};
```

### 1.3 Configure Jest
```javascript
// jest.config.js
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  roots: ['<rootDir>/packages'],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/packages/form-engine/src/$1',
    '^@/components/ui/(.*)$': '<rootDir>/components/ui/$1',
    '^@/lib/(.*)$': '<rootDir>/lib/$1'
  },
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      tsconfig: {
        jsx: 'react',
        esModuleInterop: true
      }
    }]
  },
  collectCoverageFrom: [
    'packages/form-engine/src/**/*.{ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**'
  ]
};
```

```javascript
// jest.setup.js
import '@testing-library/jest-dom';

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});
```

### 1.4 Update Type Declarations
```typescript
// packages/form-engine/src/types/external.d.ts
// Remove TODOs and add proper types

declare module 'localforage' {
  interface LocalForageOptions {
    driver?: string | string[];
    name?: string;
    storeName?: string;
    version?: number;
    size?: number;
    description?: string;
  }
  
  interface LocalForage {
    getItem<T>(key: string): Promise<T | null>;
    setItem<T>(key: string, value: T): Promise<T>;
    removeItem(key: string): Promise<void>;
    clear(): Promise<void>;
    length(): Promise<number>;
    key(index: number): Promise<string>;
    keys(): Promise<string[]>;
    config(options: LocalForageOptions): void;
  }
  
  const localforage: LocalForage;
  export default localforage;
}

declare module 'crypto-js' {
  namespace CryptoJS {
    namespace AES {
      function encrypt(message: string, key: string): { toString(): string };
      function decrypt(encrypted: string, key: string): { toString(encoding: any): string };
    }
    namespace enc {
      const Utf8: any;
    }
  }
  export default CryptoJS;
}

// Continue updating other modules...
```

---

## Phase 2: Complete Field Registry (Day 2)

### 2.1 Implement Missing Field Components
```bash
# Create missing components
touch packages/form-engine/src/components/fields/RadioGroupField.tsx
touch packages/form-engine/src/components/fields/SliderField.tsx
touch packages/form-engine/src/components/fields/RatingField.tsx
touch packages/form-engine/src/components/fields/FileUploadField.tsx
touch packages/form-engine/src/components/fields/specialized/CurrencyField.tsx
touch packages/form-engine/src/components/fields/specialized/PhoneField.tsx
touch packages/form-engine/src/components/fields/specialized/EmailField.tsx
```

### 2.2 Update Existing Components to Use shadcn/ui
```typescript
// Quick fix for TextField.tsx
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

export const TextField: React.FC<FieldProps> = ({ 
  name, 
  placeholder, 
  disabled, 
  error,
  ...props 
}) => {
  return (
    <Input
      id={name}
      name={name}
      placeholder={placeholder}
      disabled={disabled}
      className={cn(error && 'border-red-500')}
      {...props}
    />
  );
};
```

### 2.3 Register All Components
```typescript
// packages/form-engine/src/core/field-registry.ts
export function initializeFieldRegistry(): void {
  const registry = FieldRegistry.getInstance();
  
  // Import all components
  const components = {
    Text: TextField,
    Number: NumberField,
    TextArea: TextAreaField,
    Select: SelectField,
    Checkbox: CheckboxField,
    RadioGroup: RadioGroupField,
    Date: DateField,
    FileUpload: FileUploadField,
    Slider: SliderField,
    Rating: RatingField,
    Currency: CurrencyField,
    Phone: PhoneField,
    Email: EmailField,
    // ... add all others
  };
  
  Object.entries(components).forEach(([type, component]) => {
    registry.register(type as WidgetType, { component });
  });
}
```

---

## Phase 3: Fix XState Integration (Day 2-3)

### 3.1 Complete Submission Action
```typescript
// packages/form-engine/src/state-machine/machine-factory.ts

const submitAction = assign({
  submissionState: (context: FormStateMachineContext) => ({
    isSubmitting: false,
    submitted: true,
    submitCount: context.submissionState.submitCount + 1,
    lastSubmittedAt: new Date().toISOString()
  }),
  errors: {} // Clear errors on successful submission
});

// Update the machine configuration
submitting: {
  invoke: {
    src: 'submitForm',
    onDone: {
      target: 'submitted',
      actions: submitAction
    },
    onError: {
      target: 'editing',
      actions: assign({
        submissionState: (context) => ({
          ...context.submissionState,
          isSubmitting: false,
          error: 'Submission failed'
        })
      })
    }
  }
}
```

### 3.2 Add Integration Tests
```typescript
// packages/form-engine/src/state-machine/__tests__/integration.test.ts
import { createFormStateMachine } from '../machine-factory';
import { interpret } from 'xstate';

describe('XState Form Integration', () => {
  it('should handle complete form flow', (done) => {
    const machine = createFormStateMachine(mockSchema);
    
    const service = interpret(machine)
      .onTransition((state) => {
        if (state.matches('submitted')) {
          expect(state.context.submissionState.submitted).toBe(true);
          done();
        }
      })
      .start();
    
    service.send({ type: 'NEXT_STEP' });
    service.send({ type: 'SUBMIT' });
  });
});
```

---

## Phase 4: Validation & Testing (Day 3)

### 4.1 Create Smoke Tests
```typescript
// packages/form-engine/__tests__/smoke.test.ts
describe('Form Engine Smoke Tests', () => {
  it('should export all required modules', () => {
    const modules = require('../src/index');
    
    expect(modules.FormEngine).toBeDefined();
    expect(modules.FieldRegistry).toBeDefined();
    expect(modules.ValidationEngine).toBeDefined();
    expect(modules.RuleEngine).toBeDefined();
    expect(modules.FormRenderer).toBeDefined();
  });
  
  it('should render a basic form', () => {
    const { getByText } = render(
      <FormRenderer schema={basicSchema} onSubmit={jest.fn()} />
    );
    
    expect(getByText('Submit')).toBeInTheDocument();
  });
});
```

### 4.2 Fix Size Limits
```javascript
// .size-limit.js
module.exports = [
  {
    name: 'Form Engine Core',
    path: 'packages/form-engine/dist/index.js',
    limit: '150 KB',
    webpack: false
  },
  {
    name: 'Form Engine + React',
    path: 'packages/form-engine/dist/index.js',
    limit: '200 KB',
    webpack: true
  }
];
```

---

## Phase 5: Demo Form Validation (Day 4)

### 5.1 Create Minimal Working Demo
```typescript
// app/demo/page.tsx
import { DemoForm } from '@/demo/DemoForm';
import { Suspense } from 'react';

export default function DemoPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <DemoForm />
    </Suspense>
  );
}
```

### 5.2 E2E Test for Demo
```typescript
// e2e/demo.spec.ts
import { test, expect } from '@playwright/test';

test('demo form loads and submits', async ({ page }) => {
  await page.goto('/demo');
  
  // Fill first step
  await page.fill('[name="firstName"]', 'Test');
  await page.fill('[name="lastName"]', 'User');
  await page.fill('[name="email"]', 'test@example.com');
  await page.fill('[name="dateOfBirth"]', '1990-01-01');
  
  // Navigate
  await page.click('button:has-text("Next")');
  
  // Verify navigation worked
  await expect(page.locator('text=Employment Status')).toBeVisible();
});
```

---

## Verification Checklist

Run these commands after each phase to verify progress:

```bash
# Phase 1 Verification
npm run lint       # Should pass with warnings only
npm run typecheck  # Should pass with no errors

# Phase 2 Verification  
npm test -- packages/form-engine/src/components/fields  # Field tests pass

# Phase 3 Verification
npm test -- packages/form-engine/src/state-machine  # State tests pass

# Phase 4 Verification
npm run build  # Builds successfully
npm run size   # Within budget

# Phase 5 Verification
npm run dev
# Navigate to /demo and test manually
npm run test:e2e  # E2E tests pass
```

---

## Quick Wins (Can Do Immediately)

1. **Install all dependencies** (30 minutes)
```bash
npm install --save swr expr-eval jsonpath web-vitals @babel/parser @babel/traverse zod-to-json-schema
npm install --save-dev eslint jest @types/jest ts-jest @testing-library/react
```

2. **Fix type stubs** (1 hour)
- Replace `any` types in external.d.ts with proper interfaces
- Remove TODO comments

3. **Create minimal field components** (2 hours)
- Copy TextField pattern for missing components
- Use shadcn/ui Input as base

---

## Risk Mitigation

### If Time Constrained:
1. **Minimum Viable Fix**: Just install dependencies and fix type errors
2. **Field Registry**: Implement only 3 additional fields (RadioGroup, FileUpload, Currency)
3. **XState**: Keep placeholder but make it non-blocking
4. **Demo**: Create simplified version with fewer steps

### Testing Strategy:
1. Start with smoke tests
2. Add integration tests for critical paths
3. Manual testing for demo form
4. Performance testing can be deferred

---

## Expected Timeline
- **Day 1**: Infrastructure & Dependencies (4 hours)
- **Day 2**: Field Registry (6 hours)
- **Day 3**: XState & Testing (4 hours)
- **Day 4**: Demo & Validation (2 hours)

**Total: ~16 hours of focused work**

## Success Metrics
- ✅ All npm scripts pass (lint, typecheck, test, build, size)
- ✅ At least 10 field types registered
- ✅ Demo form renders and submits
- ✅ No TypeScript errors
- ✅ Bundle size under 150KB