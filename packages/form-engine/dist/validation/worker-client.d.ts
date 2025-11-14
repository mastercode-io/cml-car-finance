import type { JSONSchema, ValidationOptions, ValidationResult } from '../types';
import { ValidationEngine } from './ajv-setup';
export declare class ValidationWorkerClient {
    private worker;
    private ready;
    private resolveReady;
    private fallbackEngine;
    constructor(engine?: ValidationEngine);
    validate(schema: JSONSchema, data: unknown, options?: ValidationOptions): Promise<ValidationResult>;
    compile(schema: JSONSchema): Promise<void>;
    terminate(): void;
    private initWorker;
    private getWorkerConstructor;
}
//# sourceMappingURL=worker-client.d.ts.map