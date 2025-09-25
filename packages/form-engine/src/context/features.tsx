'use client';

import * as React from 'react';

import type { FeatureFlags, FeatureFlagName, UnifiedFormSchema } from '../types';

const DEFAULT_FEATURE_FLAGS: FeatureFlags = {
  gridLayout: false,
  addressLookupUK: false,
  reviewSummary: false,
  'nav.dedupeToken': false,
};

type FeaturesContextValue = FeatureFlags;

const FeaturesContext = React.createContext<FeaturesContextValue>(DEFAULT_FEATURE_FLAGS);

export interface FeaturesProviderProps {
  schema?: UnifiedFormSchema | null;
  children: React.ReactNode;
  overrides?: Partial<FeatureFlags>;
}

type FeatureResolutionParams = {
  schemaFeatures?: Record<string, boolean | undefined>;
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

    const parsed = parseBoolean(rawValue);
    if (parsed === undefined) {
      return acc;
    }

    acc[key] = parsed;
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
      if (key in DEFAULT_FEATURE_FLAGS && typeof value === 'boolean') {
        resolved[key as FeatureFlagName] = value;
      }
    }
  }

  if (propOverrides) {
    for (const [key, value] of Object.entries(propOverrides)) {
      if (key in DEFAULT_FEATURE_FLAGS && typeof value === 'boolean') {
        resolved[key as FeatureFlagName] = value;
      }
    }
  }

  if (envOverrides) {
    for (const [key, value] of Object.entries(envOverrides)) {
      if (key in DEFAULT_FEATURE_FLAGS && typeof value === 'boolean') {
        resolved[key as FeatureFlagName] = value;
      }
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

export const useFlag = (name: FeatureFlagName, defaultValue?: boolean): boolean => {
  const features = useFeatures();
  if (name in features) {
    return features[name];
  }
  return defaultValue ?? false;
};

export const getDefaultFeatureFlags = (): FeatureFlags => ({ ...DEFAULT_FEATURE_FLAGS });

export const __TESTING__ = {
  parseEnvFlags,
  resolveFeatureFlags,
};
