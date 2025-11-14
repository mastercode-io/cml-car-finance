import type { ComputedField, DataSourceMap } from './computed.types';
import type { BooleanFeatureFlagName, JumpToFirstInvalidMode } from './features.types';
import type { JSONSchema } from './json-schema.types';
import type { Rule, StepTransition } from './rules.types';
import type { UIDefinition } from './ui.types';
export interface ValidationConfig {
    strategy?: 'onChange' | 'onSubmit' | 'onBlur';
    debounceMs?: number;
    asyncTimeoutMs?: number;
    suppressInlineErrors?: boolean;
}
export interface FormMetadata {
    title: string;
    description?: string;
    sensitivity: 'low' | 'medium' | 'high';
    retainHidden?: boolean;
    allowAutosave?: boolean;
    timeout?: number;
    tags?: string[];
    owner?: string;
    lastModified?: string;
    requiresAudit?: boolean;
}
export interface FormStep {
    id: string;
    title: string;
    description?: string;
    schema: JSONSchema | {
        $ref: string;
    };
    visibleWhen?: Rule;
    timeout?: number;
    helpText?: string;
}
export interface ReviewNavigationPolicy {
    stepId?: string;
    terminal?: boolean;
    validate?: 'none' | 'step' | 'form';
    freezeNavigation?: boolean;
}
export interface ResolvedReviewNavigationPolicy {
    stepId: string;
    terminal: boolean;
    validate: 'none' | 'step' | 'form';
    freezeNavigation: boolean;
}
export interface NavigationConfig {
    review?: ReviewNavigationPolicy;
    jumpToFirstInvalidOn?: JumpToFirstInvalidMode;
}
export interface UnifiedFormSchema {
    $id: string;
    version: string;
    extends?: string[];
    metadata: FormMetadata;
    definitions?: Record<string, JSONSchema>;
    steps: FormStep[];
    transitions: StepTransition[];
    ui: UIDefinition;
    computed?: ComputedField[];
    dataSources?: DataSourceMap;
    validation?: ValidationConfig;
    features?: (Partial<Record<BooleanFeatureFlagName, boolean>> & Partial<Record<'nav.jumpToFirstInvalidOn', JumpToFirstInvalidMode>> & {
        [key: string]: boolean | string | undefined;
    }) | undefined;
    navigation?: NavigationConfig;
}
export interface SchemaVersionMeta {
    id: string;
    version: string;
    deprecated?: boolean;
    deprecationDate?: string;
    migrateTo?: string;
}
//# sourceMappingURL=schema.types.d.ts.map