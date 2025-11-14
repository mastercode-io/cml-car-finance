import * as React from 'react';
import type { StepStatus } from './utils';
interface StepProgressProps {
    steps: Array<{
        id: string;
        title: string;
        status: StepStatus;
    }>;
    currentStep: string;
    orientation?: 'horizontal' | 'vertical';
    showLabels?: boolean;
    onStepSelect?: (stepId: string) => void;
}
export declare const StepProgress: React.FC<StepProgressProps>;
export {};
//# sourceMappingURL=StepProgress.d.ts.map