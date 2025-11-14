'use client';
import { jsx as _jsx } from "react/jsx-runtime";
import * as React from 'react';
const DEFAULT_FEATURE_FLAGS = {
    gridLayout: false,
    addressLookupUK: false,
    reviewSummary: false,
    'nav.dedupeToken': false,
    'nav.reviewFreeze': false,
    'nav.jumpToFirstInvalidOn': 'submit',
};
const FeaturesContext = React.createContext(DEFAULT_FEATURE_FLAGS);
const parseBoolean = (value) => {
    const normalized = value.trim().toLowerCase();
    if (['1', 'true', 'on', 'yes', 'enabled'].includes(normalized)) {
        return true;
    }
    if (['0', 'false', 'off', 'no', 'disabled'].includes(normalized)) {
        return false;
    }
    return undefined;
};
const isJumpMode = (value) => ['submit', 'next', 'never'].includes(value.trim().toLowerCase());
const setResolvedFlag = (target, key, value) => {
    if (value === undefined) {
        return;
    }
    if (key === 'nav.jumpToFirstInvalidOn') {
        target[key] = value;
        return;
    }
    target[key] = Boolean(value);
};
const parseEnvFlags = (input) => {
    if (!input) {
        return {};
    }
    return input.split(',').reduce((acc, pair) => {
        const [rawKey, rawValue] = pair.split('=');
        if (!rawKey || rawValue === undefined) {
            return acc;
        }
        const key = rawKey.trim();
        if (!(key in DEFAULT_FEATURE_FLAGS)) {
            return acc;
        }
        if (key === 'nav.jumpToFirstInvalidOn') {
            const normalized = rawValue.trim().toLowerCase();
            if (isJumpMode(normalized)) {
                acc[key] = normalized;
            }
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
const resolveFeatureFlags = ({ schemaFeatures, envOverrides, propOverrides, }) => {
    const resolved = { ...DEFAULT_FEATURE_FLAGS };
    if (schemaFeatures) {
        for (const [key, value] of Object.entries(schemaFeatures)) {
            if (!(key in DEFAULT_FEATURE_FLAGS)) {
                continue;
            }
            if (key === 'nav.jumpToFirstInvalidOn') {
                if (typeof value === 'string' && isJumpMode(value)) {
                    resolved[key] = value;
                }
                continue;
            }
            if (typeof value === 'boolean') {
                resolved[key] = value;
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
                    resolved[key] = value;
                }
                continue;
            }
            if (typeof value === 'boolean') {
                resolved[key] = value;
            }
        }
    }
    if (envOverrides) {
        for (const [key, value] of Object.entries(envOverrides)) {
            setResolvedFlag(resolved, key, value);
        }
    }
    return resolved;
};
export const FeaturesProvider = ({ schema, children, overrides, }) => {
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
    return _jsx(FeaturesContext.Provider, { value: value, children: children });
};
export const useFeatures = () => {
    return React.useContext(FeaturesContext);
};
export function useFlag(name, defaultValue) {
    const features = useFeatures();
    if (name in features) {
        return features[name];
    }
    if (defaultValue !== undefined) {
        return defaultValue;
    }
    return DEFAULT_FEATURE_FLAGS[name];
}
export const getDefaultFeatureFlags = () => ({ ...DEFAULT_FEATURE_FLAGS });
export const __TESTING__ = {
    parseEnvFlags,
    resolveFeatureFlags,
};
//# sourceMappingURL=features.js.map