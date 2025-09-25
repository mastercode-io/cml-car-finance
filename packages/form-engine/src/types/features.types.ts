export type FeatureFlagName =
  | 'gridLayout'
  | 'addressLookupUK'
  | 'reviewSummary'
  | 'nav.dedupeToken';

export type FeatureFlags = Record<FeatureFlagName, boolean>;
