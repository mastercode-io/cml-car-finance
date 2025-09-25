'use client';

import * as React from 'react';

import { FormRenderer, type UnifiedFormSchema } from '@form-engine/index';

const reviewFreezeSchema: UnifiedFormSchema = {
  $id: 'review-freeze-demo',
  version: '1.0.0',
  metadata: {
    title: 'Review Freeze Demo',
    description: 'Minimal flow exercising the review freeze navigation guard.',
    sensitivity: 'low',
    allowAutosave: false,
  },
  steps: [
    {
      id: 'details',
      title: 'Basic details',
      description: 'Provide a single required field before continuing.',
      schema: {
        type: 'object',
        properties: {
          firstName: {
            type: 'string',
            minLength: 1,
          },
        },
        required: ['firstName'],
      },
    },
    {
      id: 'review',
      title: 'Review & Submit',
      description: 'Confirm the information before attempting to continue.',
      schema: {
        type: 'object',
        properties: {
          confirmAccuracy: {
            type: 'boolean',
          },
        },
        required: ['confirmAccuracy'],
      },
    },
    {
      id: 'confirmation',
      title: 'Confirmation',
      description: 'Final acknowledgement reached only when review allows forward navigation.',
      schema: {
        type: 'object',
        properties: {},
      },
    },
  ],
  transitions: [
    { from: 'details', to: 'review', default: true },
    { from: 'review', to: 'confirmation', default: true },
  ],
  navigation: {
    review: {
      stepId: 'review',
      validate: 'form',
    },
  },
  ui: {
    layout: {
      type: 'single-column',
      gutter: 24,
    },
    widgets: {
      firstName: {
        component: 'Text',
        label: 'First name',
        placeholder: 'Ada',
      },
      confirmAccuracy: {
        component: 'Checkbox',
        label: 'I confirm this application is accurate',
      },
    },
  },
};

export const ReviewFreezeDemoForm: React.FC = () => {
  const [submission, setSubmission] = React.useState<Record<string, unknown> | null>(null);

  return (
    <div className="space-y-6">
      <FormRenderer
        schema={reviewFreezeSchema}
        onSubmit={async (values) => {
          setSubmission(values);
        }}
      />

      {submission ? (
        <div
          role="status"
          className="rounded-md border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900"
        >
          <p className="font-semibold">Submission received</p>
          <pre className="mt-3 max-h-64 overflow-x-auto rounded bg-white/90 p-3 text-xs text-slate-700">
            {JSON.stringify(submission, null, 2)}
          </pre>
        </div>
      ) : null}
    </div>
  );
};

