export type {
  ComparisonRule,
  CustomRule,
  JSONSchema,
  UnifiedFormSchema,
  ValidationError,
  ValidationOptions,
  ValidationResult,
  WidgetType,
} from './types';

export { SchemaComposer } from './core/schema-composer';
export { SchemaVersionManager, type SchemaVersion, type Migration } from './core/schema-versioning';
export { FieldRegistry, initializeFieldRegistry, type FieldComponent } from './core/field-registry';

export { FieldFactory, type FieldFactoryProps } from './components/fields/FieldFactory';
export { PerformanceDashboard } from './components/PerformanceDashboard';

export { FormRenderer, type FormRendererProps } from './renderer/FormRenderer';

export { FeaturesProvider, useFeatures, useFlag, getDefaultFeatureFlags } from './context/features';

export { RuleBuilder } from './rules/rule-builder';
export { RuleEvaluator } from './rules/rule-evaluator';
export { TransitionEngine } from './rules/transition-engine';
export { VisibilityController } from './rules/visibility-controller';
export { XStateAdapter } from './rules/xstate-adapter';

export { ValidationEngine, type PerformanceMetrics } from './validation/ajv-setup';
export { createAjvResolver } from './validation/rhf-resolver';
export { StepValidator } from './validation/step-validator';
export { ValidationWorkerClient } from './validation/worker-client';

export { SchemaValidator } from './utils/schema-validator';
export { lintNavigationSchema, type NavigationLintResult } from './utils/navigation-linter';

export {
  PersistenceManager,
  type DraftData,
  type DraftMetadata,
  type PersistenceConfig,
  type SaveOptions,
  type StoredDraft,
  DEFAULT_PAYLOAD_VERSION,
} from './persistence/PersistenceManager';
export { useAutosave } from './persistence/useAutosave';
export { DraftRecovery } from './persistence/DraftRecovery';
export { ConflictResolver } from './persistence/ConflictResolver';

export { ComputedFieldEngine } from './computed/ComputedFieldEngine';

export { DataSourceManager } from './datasources/DataSourceManager';

export { FormAnalytics } from './analytics/FormAnalytics';

export { PerformanceBudget } from './performance/PerformanceBudget';

export { useFormAnalytics, type UseFormAnalyticsResult } from './hooks/useFormAnalytics';
export { useStepValidation } from './hooks/useStepValidation';
export { useComputedFields } from './hooks/useComputedFields';
export { useDataSource } from './hooks/useDataSource';

export { ZodMigrator } from './migration/ZodMigrator';
export { ReactFormMigrator } from './migration/ReactFormMigrator';

export { PathGenerator } from './testing/PathGenerator';
