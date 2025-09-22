import type { UnifiedFormSchema } from '@form-engine/index';

export const demoFormSchema: UnifiedFormSchema = {
  $id: 'employment-application-demo',
  version: '1.0.0',
  metadata: {
    title: 'Employment Application Demo',
    description:
      'Comprehensive job application demonstrating validation, branching, and persistence.',
    sensitivity: 'high',
    allowAutosave: true,
    retainHidden: false,
    requiresAudit: true,
    tags: ['demo', 'employment', 'multi-step'],
    owner: 'Form Experience Team',
    lastModified: new Date().toISOString(),
  },
  definitions: {
    phoneNumber: {
      type: 'string',
      pattern: '^(\\+?[0-9\\s-]{7,15})$',
      description: 'International format is supported.',
    },
    url: {
      type: 'string',
      format: 'uri',
    },
  },
  steps: [
    {
      id: 'personal',
      title: 'Personal Information',
      description: 'Share how we can get in touch and verify your eligibility.',
      schema: {
        type: 'object',
        properties: {
          firstName: {
            type: 'string',
            minLength: 2,
            maxLength: 50,
          },
          lastName: {
            type: 'string',
            minLength: 2,
            maxLength: 50,
          },
          email: {
            type: 'string',
            format: 'email',
          },
          phone: {
            $ref: '#/definitions/phoneNumber',
          },
          dateOfBirth: {
            type: 'string',
            format: 'date',
          },
        },
        required: ['firstName', 'lastName', 'email', 'dateOfBirth'],
      },
    },
    {
      id: 'employment',
      title: 'Employment Status',
      description: 'Tell us about your current working situation.',
      visibleWhen: {
        op: 'gte',
        left: '$.age',
        right: 18,
      },
      schema: {
        type: 'object',
        properties: {
          currentStatus: {
            type: 'string',
            enum: ['employed', 'self-employed', 'unemployed', 'student'],
          },
          employer: {
            type: 'string',
            minLength: 2,
            maxLength: 100,
            'x-visibility': {
              op: 'in',
              left: '$.currentStatus',
              right: ['employed', 'self-employed'],
            },
          },
          position: {
            type: 'string',
            minLength: 2,
            maxLength: 100,
            'x-visibility': {
              op: 'in',
              left: '$.currentStatus',
              right: ['employed', 'self-employed'],
            },
          },
          salary: {
            type: 'number',
            minimum: 0,
            maximum: 1000000,
            'x-visibility': {
              op: 'eq',
              left: '$.currentStatus',
              right: 'employed',
            },
          },
          startDate: {
            type: 'string',
            format: 'date',
            'x-visibility': {
              op: 'in',
              left: '$.currentStatus',
              right: ['employed', 'self-employed'],
            },
          },
        },
        required: ['currentStatus'],
      },
    },
    {
      id: 'experience',
      title: 'Experience & Highlights',
      description: 'Summarise your recent experience and standout work.',
      visibleWhen: {
        op: 'in',
        left: '$.currentStatus',
        right: ['employed', 'self-employed', 'unemployed'],
      },
      schema: {
        type: 'object',
        properties: {
          yearsExperience: {
            type: 'number',
            minimum: 0,
            maximum: 50,
          },
          keySkills: {
            type: 'string',
            minLength: 3,
            maxLength: 500,
          },
          highlightProjects: {
            type: 'string',
            maxLength: 1000,
          },
        },
        required: ['yearsExperience'],
      },
    },
    {
      id: 'education',
      title: 'Education',
      description: 'Provide the most relevant details about your education.',
      schema: {
        type: 'object',
        properties: {
          highestDegree: {
            type: 'string',
            enum: ['high-school', 'associates', 'bachelors', 'masters', 'doctorate'],
          },
          institution: {
            type: 'string',
            minLength: 2,
            maxLength: 120,
          },
          graduationYear: {
            type: 'number',
            minimum: 1950,
            maximum: new Date().getFullYear(),
          },
          gpa: {
            type: 'number',
            minimum: 0,
            maximum: 4,
            'x-visibility': {
              op: 'in',
              left: '$.highestDegree',
              right: ['associates', 'bachelors', 'masters', 'doctorate'],
            },
          },
        },
        required: ['highestDegree'],
      },
    },
    {
      id: 'preferences',
      title: 'Role Preferences',
      description: 'Help us tailor opportunities to what matters most to you.',
      schema: {
        type: 'object',
        properties: {
          jobType: {
            type: 'string',
            enum: ['full-time', 'part-time', 'contract', 'internship'],
          },
          remotePreference: {
            type: 'string',
            enum: ['remote', 'hybrid', 'onsite'],
          },
          salaryExpectation: {
            type: 'number',
            minimum: 0,
            maximum: 1000000,
          },
          availabilityDate: {
            type: 'string',
            format: 'date',
          },
          relocate: {
            type: 'boolean',
          },
          preferredLocation: {
            type: 'string',
            minLength: 2,
            maxLength: 120,
            'x-visibility': {
              op: 'not',
              args: [
                {
                  op: 'eq',
                  left: '$.relocate',
                  right: true,
                },
              ],
            },
          },
          references: {
            type: 'array',
            minItems: 1,
            maxItems: 3,
            items: {
              type: 'object',
              properties: {
                fullName: {
                  type: 'string',
                  minLength: 2,
                  maxLength: 120,
                },
                relationship: {
                  type: 'string',
                  minLength: 2,
                  maxLength: 120,
                },
                email: {
                  type: 'string',
                  format: 'email',
                },
              },
              required: ['fullName', 'relationship', 'email'],
            },
          },
        },
        required: ['jobType', 'remotePreference', 'references'],
      },
    },
    {
      id: 'legal',
      title: 'Declarations',
      description: 'Confirm your eligibility to work with us.',
      schema: {
        type: 'object',
        properties: {
          workAuthorization: {
            type: 'boolean',
          },
          requiresSponsorship: {
            type: 'boolean',
            'x-visibility': {
              op: 'eq',
              left: '$.workAuthorization',
              right: false,
            },
          },
          backgroundCheckConsent: {
            type: 'boolean',
          },
        },
        required: ['workAuthorization', 'backgroundCheckConsent'],
      },
    },
    {
      id: 'review',
      title: 'Review & Submit',
      description: 'One final step before we submit your application.',
      schema: {
        type: 'object',
        properties: {
          confirmAccuracy: {
            type: 'boolean',
          },
          coverLetter: {
            type: 'string',
            maxLength: 2000,
          },
        },
        required: ['confirmAccuracy'],
      },
    },
  ],
  transitions: [
    {
      from: 'personal',
      to: 'education',
      when: {
        op: 'lt',
        left: '$.age',
        right: 18,
      },
    },
    {
      from: 'personal',
      to: 'employment',
      default: true,
    },
    {
      from: 'employment',
      to: 'experience',
      when: {
        op: 'in',
        left: '$.currentStatus',
        right: ['employed', 'self-employed', 'unemployed'],
      },
    },
    {
      from: 'employment',
      to: 'education',
      default: true,
    },
    {
      from: 'experience',
      to: 'education',
      default: true,
    },
    {
      from: 'education',
      to: 'preferences',
      default: true,
    },
    {
      from: 'preferences',
      to: 'legal',
      default: true,
    },
    {
      from: 'legal',
      to: 'review',
      default: true,
    },
  ],
  ui: {
    layout: {
      type: 'single-column',
      gutter: 24,
    },
    theme: {
      brandColor: '#1d4ed8',
      accentColor: '#0f172a',
      density: 'comfortable',
      cornerRadius: 'md',
      tone: 'light',
    },
    widgets: {
      firstName: {
        component: 'Text',
        label: 'First name',
        placeholder: 'Jane',
      },
      lastName: {
        component: 'Text',
        label: 'Last name',
        placeholder: 'Doe',
      },
      email: {
        component: 'Text',
        label: 'Email address',
        placeholder: 'jane.doe@example.com',
        description: 'We will use this email for all communication.',
      },
      phone: {
        component: 'Text',
        label: 'Phone number',
        placeholder: '+1 202 555 0108',
      },
      dateOfBirth: {
        component: 'Date',
        label: 'Date of birth',
      },
      currentStatus: {
        component: 'Select',
        label: 'Current employment status',
        placeholder: 'Select status',
        options: [
          { value: 'employed', label: 'Employed' },
          { value: 'self-employed', label: 'Self-employed' },
          { value: 'unemployed', label: 'Between roles' },
          { value: 'student', label: 'Student' },
        ],
      },
      employer: {
        component: 'Text',
        label: 'Employer name',
        placeholder: 'Acme Corp',
      },
      position: {
        component: 'Text',
        label: 'Role / Title',
        placeholder: 'Senior Developer',
      },
      salary: {
        component: 'Number',
        label: 'Monthly salary',
        helpText: 'Enter your gross monthly salary in GBP.',
      },
      startDate: {
        component: 'Date',
        label: 'Start date',
      },
      yearsExperience: {
        component: 'Number',
        label: 'Years of professional experience',
      },
      keySkills: {
        component: 'TextArea',
        label: 'Key skills',
        placeholder: 'React, accessibility, stakeholder management...',
        description: 'Comma separated list of skills you are confident in.',
      },
      highlightProjects: {
        component: 'TextArea',
        label: 'Highlight a project',
        placeholder: 'Share a project you are proud of.',
      },
      highestDegree: {
        component: 'Select',
        label: 'Highest qualification',
        placeholder: 'Select degree',
        options: [
          { value: 'high-school', label: 'High school / GCSE' },
          { value: 'associates', label: 'Associate degree' },
          { value: 'bachelors', label: "Bachelor's degree" },
          { value: 'masters', label: "Master's degree" },
          { value: 'doctorate', label: 'Doctorate (PhD)' },
        ],
      },
      institution: {
        component: 'Text',
        label: 'Institution name',
      },
      graduationYear: {
        component: 'Number',
        label: 'Graduation year',
      },
      gpa: {
        component: 'Number',
        label: 'GPA / Final score',
      },
      jobType: {
        component: 'Select',
        label: 'Preferred job type',
        placeholder: 'Select type',
        options: [
          { value: 'full-time', label: 'Full-time' },
          { value: 'part-time', label: 'Part-time' },
          { value: 'contract', label: 'Contract' },
          { value: 'internship', label: 'Internship' },
        ],
      },
      remotePreference: {
        component: 'Select',
        label: 'Work location preference',
        placeholder: 'Choose an option',
        options: [
          { value: 'remote', label: 'Remote' },
          { value: 'hybrid', label: 'Hybrid' },
          { value: 'onsite', label: 'On-site' },
        ],
      },
      salaryExpectation: {
        component: 'Number',
        label: 'Expected annual salary (GBP)',
      },
      availabilityDate: {
        component: 'Date',
        label: 'Earliest start date',
      },
      relocate: {
        component: 'Checkbox',
        label: 'I am open to relocating',
      },
      preferredLocation: {
        component: 'Text',
        label: 'Preferred location',
      },
      references: {
        component: 'Repeater',
        label: 'Professional references',
        description:
          'List people who can vouch for your work. We will contact them only after discussing with you.',
        itemLabel: 'Reference',
        minItems: 1,
        maxItems: 3,
        addButtonLabel: 'Add reference',
        removeButtonLabel: 'Remove reference',
        emptyStateText: 'Add at least one reference with contact details.',
        fields: [
          {
            name: 'fullName',
            component: 'Text',
            label: 'Full name',
            placeholder: 'Alex Johnson',
            required: true,
          },
          {
            name: 'relationship',
            component: 'Text',
            label: 'Relationship',
            placeholder: 'Former manager',
            required: true,
          },
          {
            name: 'email',
            component: 'Email',
            label: 'Email address',
            placeholder: 'alex.johnson@example.com',
            required: true,
          },
        ],
      },
      workAuthorization: {
        component: 'Checkbox',
        label: 'I am authorised to work in the UK',
      },
      requiresSponsorship: {
        component: 'Checkbox',
        label: 'I require sponsorship to work in the UK',
      },
      backgroundCheckConsent: {
        component: 'Checkbox',
        label: 'I consent to background screening',
      },
      confirmAccuracy: {
        component: 'Checkbox',
        label: 'I confirm the information provided is accurate',
      },
      coverLetter: {
        component: 'TextArea',
        label: 'Cover letter',
        placeholder: 'Introduce yourself and tell us why you are a great fit.',
      },
    },
  },
  computed: [
    {
      path: '$.age',
      expr: 'year(today()) - year(dateOfBirth)',
      dependsOn: ['$.dateOfBirth'],
      recompute: 'onChange',
    },
    {
      path: '$.fullName',
      expr: 'trim(concat(firstName, " ", lastName))',
      dependsOn: ['$.firstName', '$.lastName'],
      recompute: 'onChange',
    },
    {
      path: '$.annualSalary',
      expr: 'salary * 12',
      dependsOn: ['$.salary'],
      round: 0,
      recompute: 'onChange',
    },
  ],
  dataSources: {
    employmentStatuses: {
      type: 'static',
      data: [
        { value: 'employed', label: 'Employed' },
        { value: 'self-employed', label: 'Self-employed' },
        { value: 'unemployed', label: 'Between roles' },
        { value: 'student', label: 'Student' },
      ],
    },
    jobLocations: {
      type: 'static',
      data: [
        { value: 'london', label: 'London' },
        { value: 'manchester', label: 'Manchester' },
        { value: 'remote', label: 'Fully remote' },
      ],
    },
  },
  validation: {
    strategy: 'onBlur',
    debounceMs: 120,
  },
};
