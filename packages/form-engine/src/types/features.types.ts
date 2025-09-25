export type JumpToFirstInvalidMode = 'submit' | 'next' | 'never';

export type BooleanFeatureFlagName =
  | 'gridLayout'
  | 'addressLookupUK'
  | 'reviewSummary'
  | 'nav.dedupeToken'
  | 'nav.reviewFreeze';

export type EnumFeatureFlagName = 'nav.jumpToFirstInvalidOn';

export type FeatureFlagName = BooleanFeatureFlagName | EnumFeatureFlagName;

export type FeatureFlags = Record<BooleanFeatureFlagName, boolean> & {
  'nav.jumpToFirstInvalidOn': JumpToFirstInvalidMode;
};
