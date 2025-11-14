import * as React from 'react';
import type { BooleanFeatureFlagName, FeatureFlags, JumpToFirstInvalidMode, UnifiedFormSchema } from '../types';
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
export declare const FeaturesProvider: React.FC<FeaturesProviderProps>;
export declare const useFeatures: () => FeatureFlags;
export declare function useFlag(name: BooleanFeatureFlagName, defaultValue?: boolean): boolean;
export declare function useFlag(name: 'nav.jumpToFirstInvalidOn', defaultValue?: JumpToFirstInvalidMode): JumpToFirstInvalidMode;
export declare const getDefaultFeatureFlags: () => FeatureFlags;
export declare const __TESTING__: {
    parseEnvFlags: (input?: string | null) => Partial<FeatureFlags>;
    resolveFeatureFlags: ({ schemaFeatures, envOverrides, propOverrides, }: FeatureResolutionParams) => FeatureFlags;
};
export {};
//# sourceMappingURL=features.d.ts.map