import { ValidationEngine } from './ajv-setup';
const ctx = globalThis;
let engine = null;
ctx.addEventListener('message', async (event) => {
    const message = event.data;
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
                const result = await engine.validate(message.payload.schema, message.payload.data, message.payload.options);
                ctx.postMessage({ type: 'VALIDATION_RESULT', result });
            }
            catch (error) {
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
            }
            catch (error) {
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
//# sourceMappingURL=validation.worker.js.map