# Step 11: Demo Multi-Step Form

## Step Description
Create a comprehensive demonstration form that showcases all features of the form builder engine including validation, branching logic, conditional inputs, multi-step navigation, computed fields, data persistence, and analytics. This form serves as both a test bed and a reference implementation.

## Prerequisites
- Steps 1-10 completed and functional
- All field components registered
- Validation engine working
- Rule engine operational
- Persistence layer configured
- Analytics tracking enabled
- Performance monitoring setup

## Detailed To-Do List

### 11.1 Design Demo Form Structure
```typescript
// src/demo/types.ts

export interface DemoFormData {
  // Personal Information
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: Date;
  
  // Computed fields
  age?: number;
  fullName?: string;
  
  // Employment
  currentStatus: 'employed' | 'self-employed' | 'unemployed' | 'student';
  employer?: string;
  position?: string;
  salary?: number;
  annualSalary?: number;
  startDate?: Date;
  
  // Experience
  yearsExperience?: number;
  skills?: string[];
  resume?: File;
  portfolioUrl?: string;
  
  // Education
  highestDegree: string;
  institution?: string;
  graduationYear?: number;
  gpa?: number;
  
  // Additional
  coverLetter?: string;
  references?: Array<{
    name: string;
    phone: string;
    email: string;
    relationship: string;
  }>;
  availability?: Date;
  relocate?: boolean;
  preferredLocation?: string;
  
  // Preferences
  jobType?: 'full-time' | 'part-time' | 'contract' | 'internship';
  remotePreference?: 'remote' | 'hybrid' | 'onsite';
  salaryExpectation?: number;
  
  // Legal
  workAuthorization: boolean;
  requiresSponsorship?: boolean;
  criminalRecord?: boolean;
  backgroundCheckConsent: boolean;
}
```

### 11.2 Create Complete Demo Form Schema
```typescript
// src/demo/DemoFormSchema.ts

import type { UnifiedFormSchema } from '@/types/schema.types';

export const demoFormSchema: UnifiedFormSchema = {
  $id: 'employment-application-demo',
  version: '1.0.0',
  
  metadata: {
    title: 'Employment Application Demo',
    description: 'Comprehensive job application demonstrating all form builder features',
    sensitivity: 'high',
    allowAutosave: true,
    retainHidden: false,
    requiresAudit: true,
    tags: ['demo', 'employment', 'multi-step'],
    owner: 'HR Department',
    lastModified: new Date().toISOString()
  },
  
  definitions: {
    phoneNumber: {
      type: 'string',
      pattern: '^\\+?[1-9]\\d{1,14}$',
      format: 'phone'
    },
    emailAddress: {
      type: 'string',
      format: 'email',
      pattern: '^[^@]+@[^@]+\\.[^@]+$'
    },
    reference: {
      type: 'object',
      properties: {
        name: { type: 'string', minLength: 2, maxLength: 100 },
        phone: { $ref: '#/definitions/phoneNumber' },
        email: { $ref: '#/definitions/emailAddress' },
        relationship: { 
          type: 'string',
          enum: ['supervisor', 'colleague', 'mentor', 'other']
        }
      },
      required: ['name', 'phone', 'relationship']
    }
  },
  
  steps: [
    {
      id: 'personal',
      title: 'Personal Information',
      description: 'Please provide your basic contact information',
      schema: {
        type: 'object',
        properties: {
          firstName: { 
            type: 'string', 
            minLength: 2, 
            maxLength: 50,
            pattern: '^[a-zA-Z\\s-]+$'
          },
          lastName: { 
            type: 'string', 
            minLength: 2, 
            maxLength: 50,
            pattern: '^[a-zA-Z\\s-]+$'
          },
          email: { $ref: '#/definitions/emailAddress' },
          phone: { $ref: '#/definitions/phoneNumber' },
          dateOfBirth: { 
            type: 'string', 
            format: 'date',
            'x-validation': {
              minAge: 16,
              maxAge: 100
            }
          }
        },
        required: ['firstName', 'lastName', 'email', 'dateOfBirth']
      }
    },
    
    {
      id: 'employment',
      title: 'Employment Status',
      description: 'Tell us about your current employment situation',
      schema: {
        type: 'object',
        properties: {
          currentStatus: {
            type: 'string',
            enum: ['employed', 'self-employed', 'unemployed', 'student']
          },
          employer: { 
            type: 'string',
            minLength: 2,
            maxLength: 100
          },
          position: { 
            type: 'string',
            minLength: 2,
            maxLength: 100
          },
          salary: { 
            type: 'number',
            minimum: 0,
            maximum: 10000000
          },
          startDate: { 
            type: 'string', 
            format: 'date'
          }
        },
        required: ['currentStatus']
      },
      visibleWhen: {
        op: 'gte',
        left: '$.age',
        right: 18
      }
    },
    
    {
      id: 'experience',
      title: 'Work Experience',
      description: 'Share your professional experience and skills',
      schema: {
        type: 'object',
        properties: {
          yearsExperience: { 
            type: 'number',
            minimum: 0,
            maximum: 50
          },
          skills: {
            type: 'array',
            items: { type: 'string' },
            minItems: 1,
            maxItems: 10,
            uniqueItems: true
          },
          resume: { 
            type: 'string',
            format: 'file',
            'x-validation': {
              accept: '.pdf,.doc,.docx',
              maxSize: 5242880
            }
          },
          portfolioUrl: {
            type: 'string',
            format: 'uri',
            pattern: '^https?://'
          }
        },
        required: ['yearsExperience', 'skills']
      },
      visibleWhen: {
        op: 'in',
        left: '$.currentStatus',
        right: ['employed', 'self-employed', 'unemployed']
      }
    },
    
    // Remaining steps...
    // (See full schema in 11.2 section)
  ],
  
  transitions: [
    // Complex branching logic
    // (See full transitions in 11.2 section)
  ],
  
  ui: {
    widgets: {
      // Complete widget configurations
      // (See full UI config in 11.2 section)
    }
  },
  
  computed: [
    {
      path: '$.age',
      expr: 'floor((now() - dateOfBirth) / 31536000000)',
      dependsOn: ['$.dateOfBirth'],
      recompute: 'onChange'
    },
    {
      path: '$.fullName',
      expr: 'concat(firstName, " ", lastName)',
      dependsOn: ['$.firstName', '$.lastName'],
      recompute: 'onChange'
    },
    {
      path: '$.annualSalary',
      expr: 'salary * 12',
      dependsOn: ['$.salary'],
      round: 2,
      recompute: 'onChange'
    }
  ],
  
  dataSources: {
    employmentStatuses: {
      type: 'static',
      data: [
        { value: 'employed', label: 'Currently Employed' },
        { value: 'self-employed', label: 'Self-Employed' },
        { value: 'unemployed', label: 'Seeking Employment' },
        { value: 'student', label: 'Student' }
      ]
    }
  }
};
```

### 11.3 Configure responsive grid layout

The demo schema now opts into the Phase 3 grid renderer so that each step highlights responsive columns, contextual sections, and breakpoint-aware spans.

```typescript
// src/demo/DemoFormSchema.ts (excerpt)

ui: {
  layout: {
    type: 'grid',
    gutter: 24,
    columns: 6,
    breakpoints: {
      base: 1,
      sm: 2,
      md: 6,
      lg: 12,
      xl: 12,
      '2xl': 12,
    },
    sections: [
      {
        id: 'personal-details',
        title: 'Contact details',
        rows: [
          {
            id: 'personal-names',
            fields: ['firstName', 'lastName'],
            colSpan: {
              firstName: { base: 1, sm: 1, md: 3, lg: 6 },
              lastName: { base: 1, sm: 1, md: 3, lg: 6 },
            },
          },
          {
            id: 'personal-contact',
            fields: ['email', 'phone'],
            colSpan: {
              email: { base: 1, sm: 2, md: 4, lg: 8 },
              phone: { base: 1, sm: 2, md: 2, lg: 4 },
            },
          },
        ],
      },
      {
        id: 'review-confirmation',
        title: 'Final confirmation',
        rows: [
          {
            id: 'review-consent',
            fields: ['confirmAccuracy'],
            colSpan: {
              confirmAccuracy: { base: 1, sm: 2, md: 3, lg: 4 },
            },
          },
          {
            id: 'review-cover-letter',
            fields: ['coverLetter'],
            colSpan: {
              coverLetter: { base: 1, sm: 2, md: 6, lg: 12 },
            },
          },
        ],
      },
    ],
  },
  widgets: {
    // … existing widget configuration
  },
}
```

Sections map 1:1 with form steps so content is only rendered when relevant. Rows define field order, while `colSpan` values illustrate how the grid expands from single-column on mobile to multi-column layouts on larger breakpoints. Fields hidden via conditional rules collapse automatically, ensuring no empty grid cells remain.

To verify locally, run the demo with layout flags enabled:

```bash
export NEXT_PUBLIC_FLAGS="gridLayout=1,nav.dedupeToken=1,nav.reviewFreeze=1,nav.jumpToFirstInvalidOn=submit"
npm run dev
```

Submit an invalid form to see the alert banner, tick the confirmation checkbox to unblock submission, and confirm the review step renders formatted values instead of raw JSON.

### 11.4 Create Main Demo Form Component
```typescript
// src/demo/DemoForm.tsx

import React, { useState, useEffect } from 'react';
import { FormRenderer } from '@/renderer/FormRenderer';
import { demoFormSchema } from './DemoFormSchema';
import { useFormAnalytics } from '@/hooks/useFormAnalytics';
import { PersistenceManager } from '@/persistence/PersistenceManager';
import { PerformanceDashboard } from '@/components/PerformanceDashboard';
import { DraftRecovery } from '@/persistence/DraftRecovery';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

export const DemoForm: React.FC = () => {
  const [submittedData, setSubmittedData] = useState<any>(null);
  const [showResults, setShowResults] = useState(false);
  const [showPerformance, setShowPerformance] = useState(false);
  const [draftAvailable, setDraftAvailable] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Analytics setup
  const analytics = useFormAnalytics(
    demoFormSchema.$id,
    demoFormSchema.version,
    {
      enabled: true,
      sampling: 1.0,
      sensitive: true,
      performanceBudgets: {
        stepTransition: 150,
        validation: 50,
        initialLoad: 500
      }
    }
  );
  
  // Check for existing draft on mount
  useEffect(() => {
    const checkDraft = async () => {
      const manager = new PersistenceManager({
        formId: demoFormSchema.$id,
        schemaVersion: demoFormSchema.version,
        storageType: 'local'
      });
      
      const draft = await manager.loadDraft();
      if (draft) {
        setDraftAvailable(draft);
      }
      setIsLoading(false);
    };
    
    checkDraft();
  }, []);
  
  const handleSubmit = async (data: any) => {
    console.log('📝 Form submitted:', data);
    
    // Track submission
    const measure = analytics.measureStepTransition('final', 'complete');
    
    try {
      // Simulate API call
      await new Promise((resolve, reject) => {
        setTimeout(() => {
          if (Math.random() > 0.9) {
            reject(new Error('Network error'));
          } else {
            resolve(data);
          }
        }, 1000);
      });
      
      measure();
      analytics.trackSubmission(true, data);
      
      setSubmittedData(data);
      setShowResults(true);
      
      toast.success('Application submitted successfully!', {
        description: `Thank you, ${data.fullName}! We'll review your application soon.`
      });
      
      // Clear draft after successful submission
      const manager = new PersistenceManager({
        formId: demoFormSchema.$id,
        schemaVersion: demoFormSchema.version,
        storageType: 'local'
      });
      await manager.deleteDraft();
    } catch (error) {
      measure();
      analytics.trackSubmission(false, data, error as Error);
      
      toast.error('Failed to submit application', {
        description: 'Please try again or save as draft'
      });
    }
  };
  
  const handleStepChange = (from: string, to: string) => {
    console.log(`📍 Step transition: ${from} → ${to}`);
    const measure = analytics.measureStepTransition(from, to);
    setTimeout(measure, 0);
    analytics.trackStepView(to);
  };
  
  const handleFieldChange = (field: string, value: any, eventType: 'focus' | 'blur' | 'change') => {
    console.log(`📝 Field ${eventType}: ${field}`, value);
    analytics.trackFieldInteraction(field, value, eventType);
  };
  
  const handleValidation = (stepId: string, errors: any, success: boolean) => {
    console.log(`✅ Validation ${success ? 'passed' : 'failed'} for step ${stepId}:`, errors);
    analytics.trackValidation(stepId, errors, success);
  };
  
  const handleDraftRecover = (data: any) => {
    console.log('📦 Recovering draft:', data);
    setDraftAvailable(null);
    toast.success('Draft recovered successfully');
  };
  
  const handleDraftDiscard = async () => {
    const manager = new PersistenceManager({
      formId: demoFormSchema.$id,
      schemaVersion: demoFormSchema.version,
      storageType: 'local'
    });
    await manager.deleteDraft();
    setDraftAvailable(null);
    toast.info('Draft discarded');
  };
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading form...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-6 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">
            Employment Application Demo
          </h1>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowPerformance(!showPerformance)}
            >
              {showPerformance ? 'Hide' : 'Show'} Performance
            </Button>
          </div>
        </div>
      </header>
      
      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-6 py-8">
        {/* Draft Recovery */}
        {draftAvailable && (
          <DraftRecovery
            draft={draftAvailable}
            onRecover={handleDraftRecover}
            onDiscard={handleDraftDiscard}
          />
        )}
        
        {/* Form */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <FormRenderer
            schema={demoFormSchema}
            onSubmit={handleSubmit}
            onStepChange={handleStepChange}
            onFieldChange={handleFieldChange}
            onValidation={handleValidation}
            initialData={draftAvailable?.data}
            mode="create"
            features={{
              autosave: true,
              autosaveInterval: 5000,
              showProgress: true,
              allowSkip: false,
              validateOnBlur: true,
              showFieldHints: true
            }}
            className="space-y-6"
          />
        </div>
      </main>
      
      {/* Performance Dashboard */}
      {showPerformance && <PerformanceDashboard />}
      
      {/* Results Dialog */}
      <Dialog open={showResults} onOpenChange={setShowResults}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>Application Submitted Successfully</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-green-800">
                Your application has been received and will be reviewed by our team.
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold mb-2">Submitted Data:</h3>
              <pre className="bg-gray-100 p-4 rounded-lg overflow-auto text-xs">
                {JSON.stringify(submittedData, null, 2)}
              </pre>
            </div>
            
            <div>
              <h3 className="font-semibold mb-2">Analytics Summary:</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Session ID:</span>
                  <span className="ml-2">{analytics.getSessionId()}</span>
                </div>
                <div>
                  <span className="text-gray-600">Completion Time:</span>
                  <span className="ml-2">
                    {Math.round((Date.now() - analytics.getSessionMetrics()?.startTime) / 1000)}s
                  </span>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
```

### 11.4 Create Supporting Components

#### Draft Recovery Component
```typescript
// src/demo/components/DraftRecovery.tsx

import React from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { InfoIcon } from 'lucide-react';

export const DraftRecovery: React.FC<{
  draft: any;
  onRecover: (data: any) => void;
  onDiscard: () => void;
}> = ({ draft, onRecover, onDiscard }) => {
  const draftAge = Date.now() - draft.timestamp;
  const ageInMinutes = Math.round(draftAge / 60000);
  
  return (
    <Alert className="mb-6 border-blue-200 bg-blue-50">
      <InfoIcon className="h-4 w-4 text-blue-600" />
      <AlertTitle>Unsaved Draft Found</AlertTitle>
      <AlertDescription>
        <p className="mb-3">
          We found an unsaved draft from {ageInMinutes} minute{ageInMinutes !== 1 ? 's' : ''} ago.
          Would you like to continue where you left off?
        </p>
        <div className="flex gap-2">
          <Button
            size="sm"
            onClick={() => onRecover(draft.data)}
          >
            Recover Draft
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={onDiscard}
          >
            Start Fresh
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
};
```

#### Form Progress Indicator
```typescript
// src/demo/components/FormProgress.tsx

import React from 'react';
import { CheckCircle, Circle } from 'lucide-react';

export const FormProgress: React.FC<{
  steps: Array<{ id: string; title: string }>;
  currentStep: string;
  completedSteps: string[];
}> = ({ steps, currentStep, completedSteps }) => {
  return (
    <div className="mb-8">
      <div className="flex justify-between">
        {steps.map((step, index) => {
          const isCompleted = completedSteps.includes(step.id);
          const isCurrent = step.id === currentStep;
          
          return (
            <div key={step.id} className="flex-1">
              <div className="relative">
                {index > 0 && (
                  <div
                    className={`absolute left-0 right-0 top-5 h-0.5 -translate-x-1/2 ${
                      isCompleted ? 'bg-green-500' : 'bg-gray-300'
                    }`}
                    style={{ width: 'calc(100% - 20px)' }}
                  />
                )}
                <div className="relative flex flex-col items-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      isCompleted
                        ? 'bg-green-500 text-white'
                        : isCurrent
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-300 text-gray-600'
                    }`}
                  >
                    {isCompleted ? (
                      <CheckCircle className="w-6 h-6" />
                    ) : (
                      <Circle className="w-6 h-6" />
                    )}
                  </div>
                  <span className="mt-2 text-xs text-gray-600">
                    {step.title}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
```

### 11.5 Create Demo Test Suite

#### End-to-End Tests
```typescript
// src/demo/__tests__/DemoForm.e2e.test.ts

import { test, expect } from '@playwright/test';

test.describe('Demo Form E2E', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/demo');
  });
  
  test('should complete full application flow', async ({ page }) => {
    // Personal information
    await page.fill('[name="firstName"]', 'John');
    await page.fill('[name="lastName"]', 'Doe');
    await page.fill('[name="email"]', 'john.doe@example.com');
    await page.fill('[name="phone"]', '+14155551234');
    await page.fill('[name="dateOfBirth"]', '1990-01-01');
    
    await page.click('button:has-text("Next")');
    
    // Employment status
    await page.selectOption('[name="currentStatus"]', 'employed');
    await expect(page.locator('[name="employer"]')).toBeVisible();
    await page.fill('[name="employer"]', 'Tech Corp');
    await page.fill('[name="position"]', 'Senior Developer');
    await page.fill('[name="salary"]', '120000');
    
    await page.click('button:has-text("Next")');
    
    // Experience
    await page.fill('[name="yearsExperience"]', '8');
    
    // Add skills
    const skillsInput = page.locator('[name="skills"]');
    await skillsInput.fill('JavaScript');
    await skillsInput.press('Enter');
    await skillsInput.fill('React');
    await skillsInput.press('Enter');
    await skillsInput.fill('Node.js');
    await skillsInput.press('Enter');
    
    await page.click('button:has-text("Next")');
    
    // Education
    await page.check('[value="bachelors"]');
    await page.fill('[name="institution"]', 'University');
    await page.fill('[name="graduationYear"]', '2012');
    
    await page.click('button:has-text("Next")');
    
    // Additional info should be visible
    await expect(page.locator('[name="coverLetter"]')).toBeVisible();
    
    // Submit
    await page.click('button:has-text("Submit")');
    
    // Verify submission
    await expect(page.locator('text=Application submitted successfully')).toBeVisible();
  });
  
  test('should handle branching for students', async ({ page }) => {
    // Fill personal info with young age
    await page.fill('[name="firstName"]', 'Jane');
    await page.fill('[name="lastName"]', 'Student');
    await page.fill('[name="email"]', 'jane@school.edu');
    await page.fill('[name="dateOfBirth"]', '2008-01-01');
    
    await page.click('button:has-text("Next")');
    
    // Should skip employment and go to education
    await expect(page.locator('text=Education')).toBeVisible();
    await expect(page.locator('[name="currentStatus"]')).not.toBeVisible();
  });
  
  test('should persist and recover draft', async ({ page }) => {
    // Fill some data
    await page.fill('[name="firstName"]', 'Draft');
    await page.fill('[name="lastName"]', 'Test');
    
    // Wait for autosave
    await page.waitForTimeout(6000);
    
    // Reload page
    await page.reload();
    
    // Check for draft recovery
    await expect(page.locator('text=Unsaved Draft Found')).toBeVisible();
    await page.click('button:has-text("Recover Draft")');
    
    // Verify data restored
    await expect(page.locator('[name="firstName"]')).toHaveValue('Draft');
    await expect(page.locator('[name="lastName"]')).toHaveValue('Test');
  });
  
  test('should validate required fields', async ({ page }) => {
    // Try to proceed without filling required fields
    await page.click('button:has-text("Next")');
    
    // Should show validation errors
    await expect(page.locator('text=First Name is required')).toBeVisible();
    await expect(page.locator('text=Last Name is required')).toBeVisible();
    await expect(page.locator('text=Email Address is required')).toBeVisible();
  });
  
  test('should calculate computed fields', async ({ page }) => {
    // Enter date of birth
    await page.fill('[name="dateOfBirth"]', '1990-01-01');
    
    // Age should be computed (visible in next step)
    await page.fill('[name="firstName"]', 'Test');
    await page.fill('[name="lastName"]', 'User');
    await page.fill('[name="email"]', 'test@example.com');
    
    await page.click('button:has-text("Next")');
    
    // Employment section should be visible (age >= 18)
    await expect(page.locator('text=Employment Status')).toBeVisible();
  });
});
```

#### Unit Tests for Demo Components
```typescript
// src/demo/__tests__/DemoForm.test.tsx

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { DemoForm } from '../DemoForm';
import { FormRenderer } from '@/renderer/FormRenderer';

jest.mock('@/renderer/FormRenderer');

describe('DemoForm', () => {
  beforeEach(() => {
    (FormRenderer as jest.Mock).mockImplementation(({ onSubmit }) => (
      <form onSubmit={(e) => { e.preventDefault(); onSubmit({}); }}>
        <button type="submit">Submit</button>
      </form>
    ));
  });
  
  it('should render the form', () => {
    render(<DemoForm />);
    expect(screen.getByText('Employment Application Demo')).toBeInTheDocument();
  });
  
  it('should handle form submission', async () => {
    render(<DemoForm />);
    
    const submitButton = screen.getByText('Submit');
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/Application submitted successfully/)).toBeInTheDocument();
    });
  });
  
  it('should show performance dashboard when toggled', () => {
    render(<DemoForm />);
    
    const performanceButton = screen.getByText('Show Performance');
    fireEvent.click(performanceButton);
    
    expect(screen.getByText('Hide Performance')).toBeInTheDocument();
  });
});
```

### 11.6 Create Demo Documentation

```markdown
# Demo Form Documentation

## Overview
The Employment Application Demo showcases all features of the form builder engine in a real-world scenario.

## Features Demonstrated

### 1. Multi-Step Navigation
- 7 steps with progress indicator
- Back/Next navigation
- Step validation before proceeding

### 2. Branching Logic
- Age-based routing (under 18 skips to education)
- Employment status determines experience section visibility
- Complex conditions for additional info section

### 3. Field Types
- Text inputs (names, employer)
- Email with validation
- Phone with formatting
- Date picker
- Select dropdowns
- Radio groups
- Checkboxes
- File upload
- Tags input (skills)
- Currency input (salary)
- Repeater (references)
- Textarea (cover letter)

### 4. Validation
- Required field validation
- Pattern matching (email, phone)
- Min/max length
- Number ranges
- Custom validation messages

### 5. Computed Fields
- Age calculation from date of birth
- Full name concatenation
- Annual salary calculation

### 6. Data Sources
- Static employment status options
- Dynamic data loading capability

### 7. Persistence
- Automatic draft saving every 5 seconds
- Draft recovery on page reload
- Encrypted storage for sensitive data

### 8. Analytics
- Form view tracking
- Step navigation tracking
- Field interaction monitoring
- Validation error tracking
- Performance metrics

### 9. Performance
- Step transition measurements
- Validation timing
- Performance budget monitoring
- Real-time performance dashboard

## Usage

### Running the Demo
```bash
npm run dev
# Navigate to http://localhost:3000/demo
```

### Testing
```bash
# Unit tests
npm test src/demo

# E2E tests
npm run test:e2e

# Performance tests
npm run test:perf
```

### Customization
To customize the demo form:

1. Edit `DemoFormSchema.ts` to modify form structure
2. Update field configurations in the UI section
3. Add new computed fields or data sources
4. Modify branching logic in transitions

## Test Scenarios

### Happy Path
1. Complete all fields with valid data
2. Navigate through all steps
3. Submit successfully

### Validation Testing
1. Leave required fields empty
2. Enter invalid email/phone formats
3. Exceed character limits

### Branching Testing
1. Test with age < 18 (student path)
2. Test with unemployed status
3. Test with employed + experience

### Performance Testing
1. Monitor step transition times
2. Check validation performance
3. Verify autosave doesn't block UI

### Draft Recovery
1. Fill partial form
2. Reload page
3. Recover draft
```

## Success Criteria
- ✅ All form features working correctly
- ✅ Validation prevents invalid submissions
- ✅ Branching logic routes correctly
- ✅ Computed fields update in real-time
- ✅ Draft persistence and recovery functional
- ✅ Analytics tracking all interactions
- ✅ Performance within budgets (<150ms transitions)
- ✅ Accessibility standards met (WCAG 2.1 AA)
- ✅ Mobile responsive design
- ✅ Cross-browser compatibility

## Implementation Notes

### Architecture
- Component-based structure
- Separation of concerns (schema, logic, UI)
- Hook-based state management
- Performance optimizations

### Security
- Input sanitization
- XSS prevention
- Secure data storage
- HTTPS only for production

### Monitoring
- Error tracking integration
- Performance monitoring
- Analytics dashboard
- User session replay capability

## Next Steps
With the demo form complete:
1. Deploy to staging environment
2. Conduct user acceptance testing
3. Performance load testing
4. Accessibility audit
5. Security review
6. Production deployment preparation