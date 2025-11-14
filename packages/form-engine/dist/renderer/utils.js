export function resolveStepSchema(step, schema) {
    if ('$ref' in step.schema && typeof step.schema.$ref === 'string') {
        const refPath = step.schema.$ref.replace('#/', '').split('/');
        let resolved = schema;
        for (const segment of refPath) {
            resolved = resolved?.[segment];
            if (resolved === undefined) {
                throw new Error(`Unable to resolve schema reference: ${step.schema.$ref}`);
            }
        }
        return resolved;
    }
    return step.schema;
}
export function getStepFieldNames(step, schema) {
    const stepSchema = resolveStepSchema(step, schema);
    return stepSchema.properties ? Object.keys(stepSchema.properties) : [];
}
export function getStepStatus(stepId, currentStep, completedSteps, errorSteps) {
    if (stepId === currentStep) {
        return errorSteps.has(stepId) ? 'error' : 'current';
    }
    if (errorSteps.has(stepId)) {
        return 'error';
    }
    if (completedSteps.includes(stepId)) {
        return 'completed';
    }
    return 'upcoming';
}
export function flattenFieldErrors(errors, parentPath = '') {
    const result = [];
    Object.entries(errors ?? {}).forEach(([key, value]) => {
        if (!value) {
            return;
        }
        const path = parentPath ? `${parentPath}.${key}` : key;
        if (isFieldError(value)) {
            result.push({ name: path, message: value.message });
            if (value.types) {
                Object.entries(value.types).forEach(([typeKey, typeValue]) => {
                    result.push({ name: `${path}.${typeKey}`, message: String(typeValue) });
                });
            }
            return;
        }
        if (Array.isArray(value)) {
            value.forEach((item, index) => {
                if (item) {
                    result.push(...flattenFieldErrors(item, `${path}[${index}]`));
                }
            });
            return;
        }
        if (typeof value === 'object') {
            result.push(...flattenFieldErrors(value, path));
        }
    });
    return result;
}
export function scrollToFirstError() {
    if (typeof document === 'undefined') {
        return;
    }
    const firstError = document.querySelector('[aria-invalid="true"]');
    if (firstError) {
        firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
        if (typeof firstError.focus === 'function') {
            firstError.focus({ preventScroll: true });
        }
    }
}
function isFieldError(value) {
    return (Boolean(value) && typeof value === 'object' && 'type' in value);
}
//# sourceMappingURL=utils.js.map