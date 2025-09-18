import { ValidationEngine } from './ajv-setup';
import type { JSONSchema, ValidationOptions } from '../types';

type WorkerRequest =
  | { type: 'INIT' }
  | {
      type: 'VALIDATE';
      payload: { schema: JSONSchema; data: unknown; options?: ValidationOptions };
    }
  | { type: 'COMPILE'; payload: { schema: JSONSchema } };

type WorkerResponse =
  | { type: 'READY' }
  | { type: 'VALIDATION_RESULT'; result: Awaited<ReturnType<ValidationEngine['validate']>> }
  | { type: 'COMPILED' }
  | { type: 'ERROR'; error: string };

type WorkerGlobal = {
  postMessage(message: WorkerResponse): void;
  addEventListener(type: 'message', listener: (event: { data: WorkerRequest }) => void): void;
};

const ctx: WorkerGlobal = globalThis as unknown as WorkerGlobal;
let engine: ValidationEngine | null = null;

ctx.addEventListener('message', async (event) => {
  const message = event.data as WorkerRequest;

  switch (message.type) {
    case 'INIT': {
      engine = new ValidationEngine();
      ctx.postMessage({ type: 'READY' });
      break;
    }
    case 'VALIDATE': {
      if (!engine) {
        ctx.postMessage({ type: 'ERROR', error: 'Validation engine not initialized' });
        break;
      }

      try {
        const result = await engine.validate(
          message.payload.schema,
          message.payload.data,
          message.payload.options,
        );
        ctx.postMessage({ type: 'VALIDATION_RESULT', result });
      } catch (error) {
        ctx.postMessage({
          type: 'ERROR',
          error: error instanceof Error ? error.message : 'Validation failed',
        });
      }
      break;
    }
    case 'COMPILE': {
      if (!engine) {
        ctx.postMessage({ type: 'ERROR', error: 'Validation engine not initialized' });
        break;
      }

      try {
        engine.compile(message.payload.schema);
        ctx.postMessage({ type: 'COMPILED' });
      } catch (error) {
        ctx.postMessage({
          type: 'ERROR',
          error: error instanceof Error ? error.message : 'Compilation failed',
        });
      }
      break;
    }
    default:
      ctx.postMessage({ type: 'ERROR', error: 'Unknown worker message' });
  }
});

export {};
