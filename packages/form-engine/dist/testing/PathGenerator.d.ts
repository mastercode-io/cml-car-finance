import type { Rule, UnifiedFormSchema } from '../types';
export interface TestPath {
    id: string;
    steps: string[];
    conditions: Record<string, Rule>;
    data: Record<string, any>;
    expectedOutcome: 'success' | 'validation_error' | 'blocked';
}
export interface PathGenerationOptions {
    maxPaths?: number;
    maxDepth?: number;
    coverage?: 'minimal' | 'representative' | 'exhaustive';
    includeInvalid?: boolean;
    seed?: number;
}
export declare class PathGenerator {
    private paths;
    private visited;
    private random;
    generatePaths(schema: UnifiedFormSchema, options?: PathGenerationOptions): TestPath[];
    private explorePaths;
    private generatePath;
    private generateStepData;
    private generateFieldValue;
    private generateDataForCondition;
    private selectTransition;
    private generateBoundaryPaths;
    private generateErrorPaths;
    private prunePaths;
    private createRng;
    private reset;
}
//# sourceMappingURL=PathGenerator.d.ts.map