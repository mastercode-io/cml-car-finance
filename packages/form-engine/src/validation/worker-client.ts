import type { JSONSchema, ValidationOptions, ValidationResult } from '../types';
import { ValidationEngine } from './ajv-setup';

interface MessageEventLike<T = any> {
  data: T;
}

interface WorkerLike {
  postMessage(message: unknown): void;
  addEventListener(type: 'message', listener: (event: MessageEventLike) => void): void;
  removeEventListener(type: 'message', listener: (event: MessageEventLike) => void): void;
  terminate(): void;
}

interface WorkerConstructorLike {
  new (scriptURL: string | URL, options?: { type?: 'classic' | 'module' }): WorkerLike;
}

type WorkerRequest =
  | { type: 'INIT' }
  | {
      type: 'VALIDATE';
      payload: { schema: JSONSchema; data: unknown; options?: ValidationOptions };
    }
  | { type: 'COMPILE'; payload: { schema: JSONSchema } };

type WorkerResponse =
  | { type: 'READY' }
  | { type: 'VALIDATION_RESULT'; result: ValidationResult }
  | { type: 'COMPILED' }
  | { type: 'ERROR'; error: string };

export class ValidationWorkerClient {
  private worker: WorkerLike | null = null;
  private ready: Promise<void>;
  private resolveReady: () => void = () => {};
  private fallbackEngine: ValidationEngine | null = null;

  constructor(engine?: ValidationEngine) {
    this.ready = new Promise((resolve) => {
      this.resolveReady = resolve;
    });

    const WorkerCtor = this.getWorkerConstructor();
    if (WorkerCtor) {
      this.initWorker(WorkerCtor);
    } else {
      this.fallbackEngine = engine ?? new ValidationEngine();
      this.resolveReady();
    }
  }

  async validate(
    schema: JSONSchema,
    data: unknown,
    options?: ValidationOptions,
  ): Promise<ValidationResult> {
    await this.ready;

    if (this.worker) {
      const worker = this.worker;
      return new Promise((resolve, reject) => {
        const handler = (event: MessageEventLike<WorkerResponse>) => {
          if (event.data.type === 'VALIDATION_RESULT') {
            worker.removeEventListener('message', handler);
            resolve(event.data.result);
          } else if (event.data.type === 'ERROR') {
            worker.removeEventListener('message', handler);
            reject(new Error(event.data.error));
          }
        };

        worker.addEventListener('message', handler);
        worker.postMessage({
          type: 'VALIDATE',
          payload: { schema, data, options },
        } satisfies WorkerRequest);
      });
    }

    if (!this.fallbackEngine) {
      throw new Error('Validation worker is not initialised.');
    }

    return this.fallbackEngine.validate(schema, data, options);
  }

  async compile(schema: JSONSchema): Promise<void> {
    await this.ready;

    if (this.worker) {
      const worker = this.worker;
      return new Promise((resolve, reject) => {
        const handler = (event: MessageEventLike<WorkerResponse>) => {
          if (event.data.type === 'COMPILED') {
            worker.removeEventListener('message', handler);
            resolve();
          } else if (event.data.type === 'ERROR') {
            worker.removeEventListener('message', handler);
            reject(new Error(event.data.error));
          }
        };

        worker.addEventListener('message', handler);
        worker.postMessage({ type: 'COMPILE', payload: { schema } } satisfies WorkerRequest);
      });
    }

    await this.fallbackEngine?.compile(schema);
  }

  terminate(): void {
    this.worker?.terminate();
    this.worker = null;
    this.fallbackEngine = null;
  }

  private initWorker(WorkerCtor: WorkerConstructorLike): void {
    try {
      this.worker = new WorkerCtor(new URL('./validation.worker.js', import.meta.url), {
        type: 'module',
      });

      this.worker.addEventListener('message', (event) => {
        if (event.data.type === 'READY') {
          this.resolveReady();
        }
      });

      this.worker.postMessage({ type: 'INIT' } satisfies WorkerRequest);
    } catch (error) {
      console.warn('Validation worker initialisation failed, falling back to main thread.', error);
      this.worker = null;
      this.fallbackEngine = new ValidationEngine();
      this.resolveReady();
    }
  }

  private getWorkerConstructor(): WorkerConstructorLike | undefined {
    if (typeof globalThis === 'undefined') {
      return undefined;
    }

    const ctor = (globalThis as { Worker?: WorkerConstructorLike }).Worker;
    return typeof ctor === 'function' ? ctor : undefined;
  }
}
