import { ValidationEngine } from './ajv-setup';
export class ValidationWorkerClient {
    worker = null;
    ready;
    resolveReady = () => { };
    fallbackEngine = null;
    constructor(engine) {
        this.ready = new Promise((resolve) => {
            this.resolveReady = resolve;
        });
        const WorkerCtor = this.getWorkerConstructor();
        if (WorkerCtor) {
            this.initWorker(WorkerCtor);
        }
        else {
            this.fallbackEngine = engine ?? new ValidationEngine();
            this.resolveReady();
        }
    }
    async validate(schema, data, options) {
        await this.ready;
        if (this.worker) {
            const worker = this.worker;
            return new Promise((resolve, reject) => {
                const handler = (event) => {
                    if (event.data.type === 'VALIDATION_RESULT') {
                        worker.removeEventListener('message', handler);
                        resolve(event.data.result);
                    }
                    else if (event.data.type === 'ERROR') {
                        worker.removeEventListener('message', handler);
                        reject(new Error(event.data.error));
                    }
                };
                worker.addEventListener('message', handler);
                worker.postMessage({
                    type: 'VALIDATE',
                    payload: { schema, data, options },
                });
            });
        }
        if (!this.fallbackEngine) {
            throw new Error('Validation worker is not initialised.');
        }
        return this.fallbackEngine.validate(schema, data, options);
    }
    async compile(schema) {
        await this.ready;
        if (this.worker) {
            const worker = this.worker;
            return new Promise((resolve, reject) => {
                const handler = (event) => {
                    if (event.data.type === 'COMPILED') {
                        worker.removeEventListener('message', handler);
                        resolve();
                    }
                    else if (event.data.type === 'ERROR') {
                        worker.removeEventListener('message', handler);
                        reject(new Error(event.data.error));
                    }
                };
                worker.addEventListener('message', handler);
                worker.postMessage({ type: 'COMPILE', payload: { schema } });
            });
        }
        await this.fallbackEngine?.compile(schema);
    }
    terminate() {
        this.worker?.terminate();
        this.worker = null;
        this.fallbackEngine = null;
    }
    initWorker(WorkerCtor) {
        try {
            this.worker = new WorkerCtor(new URL('./validation.worker.ts', import.meta.url), {
                type: 'module',
            });
            this.worker.addEventListener('message', (event) => {
                if (event.data.type === 'READY') {
                    this.resolveReady();
                }
            });
            this.worker.postMessage({ type: 'INIT' });
        }
        catch (error) {
            console.warn('Validation worker initialisation failed, falling back to main thread.', error);
            this.worker = null;
            this.fallbackEngine = new ValidationEngine();
            this.resolveReady();
        }
    }
    getWorkerConstructor() {
        if (typeof globalThis === 'undefined') {
            return undefined;
        }
        const ctor = globalThis.Worker;
        return typeof ctor === 'function' ? ctor : undefined;
    }
}
//# sourceMappingURL=worker-client.js.map