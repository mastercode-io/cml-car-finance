'use client';

import * as React from 'react';

import type {
  BooleanFeatureFlagName,
  FeatureFlags,
  FeatureFlagName,
  JumpToFirstInvalidMode,
  UnifiedFormSchema,
} from '../types';

const DEFAULT_FEATURE_FLAGS: FeatureFlags = {
  gridLayout: false,
  addressLookupUK: false,
  reviewSummary: false,
  'nav.dedupeToken': false,
  'nav.reviewFreeze': false,
  'nav.jumpToFirstInvalidOn': 'submit',
};

type FeaturesContextValue = FeatureFlags;

const FeaturesContext = React.createContext<FeaturesContextValue>(DEFAULT_FEATURE_FLAGS);

export interface FeaturesProviderProps {
  schema?: UnifiedFormSchema | null;
  children: React.ReactNode;
  overrides?: Partial<FeatureFlags>;
}

type FeatureResolutionParams = {
  schemaFeatures?: Record<string, unknown>;
  envOverrides?: Partial<FeatureFlags>;
  propOverrides?: Partial<FeatureFlags>;
};

const parseBoolean = (value: string): boolean | undefined => {
  const normalized = value.trim().toLowerCase();
  if (['1', 'true', 'on', 'yes', 'enabled'].includes(normalized)) {
    return true;
  }
  if (['0', 'false', 'off', 'no', 'disabled'].includes(normalized)) {
    return false;
  }
  return undefined;
};

const isJumpMode = (value: string): value is JumpToFirstInvalidMode =>
  ['submit', 'next', 'never'].includes(value.trim().toLowerCase());

const setResolvedFlag = (
  target: FeatureFlags,
  key: FeatureFlagName,
  value: FeatureFlags[FeatureFlagName] | undefined,
): void => {
  if (value === undefined) {
    return;
  }

  if (key === 'nav.jumpToFirstInvalidOn') {
    target[key] = value as JumpToFirstInvalidMode;
    return;
  }

  target[key as BooleanFeatureFlagName] = Boolean(value);
};

const parseEnvFlags = (input?: string | null): Partial<FeatureFlags> => {
  if (!input) {
    return {};
  }

  return input.split(',').reduce<Partial<FeatureFlags>>((acc, pair) => {
    const [rawKey, rawValue] = pair.split('=');
    if (!rawKey || rawValue === undefined) {
      return acc;
    }

    const key = rawKey.trim() as FeatureFlagName;
    if (!(key in DEFAULT_FEATURE_FLAGS)) {
      return acc;
    }

    if (key === 'nav.jumpToFirstInvalidOn') {
      const normalized = rawValue.trim().toLowerCase();
      if (isJumpMode(normalized)) {
        acc[key] = normalized as JumpToFirstInvalidMode;
      }
      return acc;
    }

    const parsed = parseBoolean(rawValue);
    if (parsed === undefined) {
      return acc;
    }

    acc[key as BooleanFeatureFlagName] = parsed;
    return acc;
  }, {});
};

const resolveFeatureFlags = ({
  schemaFeatures,
  envOverrides,
  propOverrides,
}: FeatureResolutionParams): FeatureFlags => {
  const resolved: FeatureFlags = { ...DEFAULT_FEATURE_FLAGS };

  if (schemaFeatures) {
    for (const [key, value] of Object.entries(schemaFeatures)) {
      if (!(key in DEFAULT_FEATURE_FLAGS)) {
        continue;
      }

      if (key === 'nav.jumpToFirstInvalidOn') {
        if (typeof value === 'string' && isJumpMode(value)) {
          resolved[key] = value as JumpToFirstInvalidMode;
        }
        continue;
      }

      if (typeof value === 'boolean') {
        resolved[key as BooleanFeatureFlagName] = value;
      }
    }
  }

  if (propOverrides) {
    for (const [key, value] of Object.entries(propOverrides)) {
      if (!(key in DEFAULT_FEATURE_FLAGS)) {
        continue;
      }

      if (key === 'nav.jumpToFirstInvalidOn') {
        if (typeof value === 'string' && isJumpMode(value)) {
          resolved[key] = value as JumpToFirstInvalidMode;
        }
        continue;
      }

      if (typeof value === 'boolean') {
        resolved[key as BooleanFeatureFlagName] = value;
      }
    }
  }

  if (envOverrides) {
    for (const [key, value] of Object.entries(envOverrides)) {
      setResolvedFlag(resolved, key as FeatureFlagName, value as FeatureFlags[FeatureFlagName]);
    }
  }

  return resolved;
};

export const FeaturesProvider: React.FC<FeaturesProviderProps> = ({
  schema,
  children,
  overrides,
}) => {
  const envOverrides = React.useMemo(() => {
    if (typeof process === 'undefined') {
      return {};
    }
    return parseEnvFlags(process.env.NEXT_PUBLIC_FLAGS);
  }, []);

  const value = React.useMemo(() => {
    return resolveFeatureFlags({
      schemaFeatures: schema?.features ?? {},
      envOverrides,
      propOverrides: overrides,
    });
  }, [envOverrides, overrides, schema?.features]);

  return <FeaturesContext.Provider value={value}>{children}</FeaturesContext.Provider>;
};

export const useFeatures = (): FeatureFlags => {
  return React.useContext(FeaturesContext);
};

export function useFlag(name: BooleanFeatureFlagName, defaultValue?: boolean): boolean;
export function useFlag(
  name: 'nav.jumpToFirstInvalidOn',
  defaultValue?: JumpToFirstInvalidMode,
): JumpToFirstInvalidMode;
export function useFlag(
  name: FeatureFlagName,
  defaultValue?: FeatureFlags[FeatureFlagName],
): FeatureFlags[FeatureFlagName] {
  const features = useFeatures();
  if (name in features) {
    return features[name];
  }
  if (defaultValue !== undefined) {
    return defaultValue as FeatureFlags[FeatureFlagName];
  }
  return DEFAULT_FEATURE_FLAGS[name];
}

export const getDefaultFeatureFlags = (): FeatureFlags => ({ ...DEFAULT_FEATURE_FLAGS });

export const __TESTING__ = {
  parseEnvFlags,
  resolveFeatureFlags,
};
