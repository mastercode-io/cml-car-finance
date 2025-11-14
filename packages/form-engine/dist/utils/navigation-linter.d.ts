import type { UnifiedFormSchema, ValidationError } from '../types';
export interface NavigationLintResult {
    errors: ValidationError[];
    warnings: ValidationError[];
}
export declare const lintNavigationSchema: (schema: UnifiedFormSchema) => NavigationLintResult;
//# sourceMappingURL=navigation-linter.d.ts.map