import * as React from 'react';
import { render, screen } from '@testing-library/react';

import type { FeatureFlags, UnifiedFormSchema } from '@form-engine/types';
import { FeaturesProvider, useFlag } from '@form-engine/index';

const buildSchema = (features?: Partial<FeatureFlags>): UnifiedFormSchema => ({
  $id: 'test-schema',
  version: '1.0.0',
  metadata: {
    title: 'Feature Flag Schema',
    sensitivity: 'low',
  },
  steps: [
    {
      id: 'step-1',
      title: 'Step 1',
      schema: {
        type: 'object',
        properties: {},
      },
    },
  ],
  transitions: [],
  ui: { widgets: {} },
  features,
});

const FlagReader: React.FC<{ name: keyof FeatureFlags }> = ({ name }) => {
  const enabled = useFlag(name);
  return <span data-testid={`flag-${name}`}>{enabled ? 'on' : 'off'}</span>;
};

describe('FeaturesProvider', () => {
  const originalEnv = process.env.NEXT_PUBLIC_FLAGS;

  afterEach(() => {
    process.env.NEXT_PUBLIC_FLAGS = originalEnv;
  });

  it('provides default flag values when no overrides are present', () => {
    process.env.NEXT_PUBLIC_FLAGS = undefined;

    render(
      <FeaturesProvider schema={buildSchema()}>
        <FlagReader name="gridLayout" />
        <FlagReader name="addressLookupUK" />
        <FlagReader name="reviewSummary" />
      </FeaturesProvider>,
    );

    expect(screen.getByTestId('flag-gridLayout')).toHaveTextContent('off');
    expect(screen.getByTestId('flag-addressLookupUK')).toHaveTextContent('off');
    expect(screen.getByTestId('flag-reviewSummary')).toHaveTextContent('off');
  });

  it('honours schema-provided flag overrides', () => {
    render(
      <FeaturesProvider schema={buildSchema({ gridLayout: true, reviewSummary: true })}>
        <FlagReader name="gridLayout" />
        <FlagReader name="reviewSummary" />
      </FeaturesProvider>,
    );

    expect(screen.getByTestId('flag-gridLayout')).toHaveTextContent('on');
    expect(screen.getByTestId('flag-reviewSummary')).toHaveTextContent('on');
  });

  it('gives precedence to environment overrides over schema values', () => {
    process.env.NEXT_PUBLIC_FLAGS = 'gridLayout=false,reviewSummary=true';

    render(
      <FeaturesProvider schema={buildSchema({ gridLayout: true, reviewSummary: false })}>
        <FlagReader name="gridLayout" />
        <FlagReader name="reviewSummary" />
      </FeaturesProvider>,
    );

    expect(screen.getByTestId('flag-gridLayout')).toHaveTextContent('off');
    expect(screen.getByTestId('flag-reviewSummary')).toHaveTextContent('on');
  });

  it('applies explicit prop overrides on top of schema defaults', () => {
    render(
      <FeaturesProvider schema={buildSchema()} overrides={{ addressLookupUK: true }}>
        <FlagReader name="addressLookupUK" />
      </FeaturesProvider>,
    );

    expect(screen.getByTestId('flag-addressLookupUK')).toHaveTextContent('on');
  });
});
