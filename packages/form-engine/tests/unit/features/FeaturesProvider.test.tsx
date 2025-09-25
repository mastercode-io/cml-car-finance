import * as React from 'react';
import { render, screen } from '@testing-library/react';

import type {
  BooleanFeatureFlagName,
  FeatureFlags,
  UnifiedFormSchema,
} from '@form-engine/types';
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

const FlagReader: React.FC<{ name: BooleanFeatureFlagName }> = ({ name }) => {
  const enabled = useFlag(name);
  return <span data-testid={`flag-${name}`}>{enabled ? 'on' : 'off'}</span>;
};

const JumpPolicyReader: React.FC = () => {
  const mode = useFlag('nav.jumpToFirstInvalidOn');
  return <span data-testid="flag-nav.jumpToFirstInvalidOn">{mode}</span>;
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
        <JumpPolicyReader />
      </FeaturesProvider>,
    );

    expect(screen.getByTestId('flag-gridLayout')).toHaveTextContent('off');
    expect(screen.getByTestId('flag-addressLookupUK')).toHaveTextContent('off');
    expect(screen.getByTestId('flag-reviewSummary')).toHaveTextContent('off');
    expect(screen.getByTestId('flag-nav.jumpToFirstInvalidOn')).toHaveTextContent('submit');
  });

  it('honours schema-provided flag overrides', () => {
    render(
      <FeaturesProvider
        schema={buildSchema({ gridLayout: true, reviewSummary: true, 'nav.jumpToFirstInvalidOn': 'next' })}
      >
        <FlagReader name="gridLayout" />
        <FlagReader name="reviewSummary" />
        <JumpPolicyReader />
      </FeaturesProvider>,
    );

    expect(screen.getByTestId('flag-gridLayout')).toHaveTextContent('on');
    expect(screen.getByTestId('flag-reviewSummary')).toHaveTextContent('on');
    expect(screen.getByTestId('flag-nav.jumpToFirstInvalidOn')).toHaveTextContent('next');
  });

  it('gives precedence to environment overrides over schema values', () => {
    process.env.NEXT_PUBLIC_FLAGS = 'gridLayout=false,reviewSummary=true,nav.jumpToFirstInvalidOn=never';

    render(
      <FeaturesProvider schema={buildSchema({ gridLayout: true, reviewSummary: false })}>
        <FlagReader name="gridLayout" />
        <FlagReader name="reviewSummary" />
        <JumpPolicyReader />
      </FeaturesProvider>,
    );

    expect(screen.getByTestId('flag-gridLayout')).toHaveTextContent('off');
    expect(screen.getByTestId('flag-reviewSummary')).toHaveTextContent('on');
    expect(screen.getByTestId('flag-nav.jumpToFirstInvalidOn')).toHaveTextContent('never');
  });

  it('applies explicit prop overrides on top of schema defaults', () => {
    render(
      <FeaturesProvider schema={buildSchema()} overrides={{ addressLookupUK: true, 'nav.jumpToFirstInvalidOn': 'next' }}>
        <FlagReader name="addressLookupUK" />
        <JumpPolicyReader />
      </FeaturesProvider>,
    );

    expect(screen.getByTestId('flag-addressLookupUK')).toHaveTextContent('on');
    expect(screen.getByTestId('flag-nav.jumpToFirstInvalidOn')).toHaveTextContent('next');
  });

  it('falls back to schema navigation when env override is invalid', () => {
    process.env.NEXT_PUBLIC_FLAGS = 'nav.jumpToFirstInvalidOn=invalid';

    render(
      <FeaturesProvider schema={buildSchema({ 'nav.jumpToFirstInvalidOn': 'never' })}>
        <JumpPolicyReader />
      </FeaturesProvider>,
    );

    expect(screen.getByTestId('flag-nav.jumpToFirstInvalidOn')).toHaveTextContent('never');
  });
});
