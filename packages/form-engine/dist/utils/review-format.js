import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
const EMPTY_PLACEHOLDER = '—';
const isPlainObject = (value) => {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
};
const isEmptyValue = (value) => {
    if (value === null || value === undefined)
        return true;
    if (typeof value === 'string') {
        return value.trim().length === 0;
    }
    if (Array.isArray(value)) {
        return value.length === 0 || value.every((item) => isEmptyValue(item));
    }
    if (isPlainObject(value)) {
        const entries = Object.values(value);
        return entries.length === 0 || entries.every((item) => isEmptyValue(item));
    }
    return false;
};
const findOptionLabel = (value, widgetConfig) => {
    const options = widgetConfig?.options;
    if (!Array.isArray(options))
        return undefined;
    return options.find((option) => {
        if (option.value === value)
            return true;
        if (typeof option.value === 'number') {
            if (typeof value === 'string' && value !== '' && Number(value) === option.value) {
                return true;
            }
        }
        if (typeof option.value === 'string') {
            if (typeof value === 'number' && String(value) === option.value) {
                return true;
            }
        }
        return false;
    })?.label;
};
const getChildWidgetConfig = (field, schema, parentConfig) => {
    const repeaterField = parentConfig?.fields?.find((item) => item.name === field);
    if (repeaterField) {
        return repeaterField;
    }
    return schema.ui?.widgets?.[field];
};
const getFieldLabel = (field, schema, widgetConfig) => {
    const repeaterField = widgetConfig?.fields?.find((item) => item.name === field);
    if (repeaterField?.label) {
        return repeaterField.label;
    }
    const schemaWidget = schema.ui?.widgets?.[field];
    if (schemaWidget?.label) {
        return schemaWidget.label;
    }
    return field;
};
const formatPrimitive = (value, widgetConfig) => {
    if (typeof value === 'boolean') {
        return value ? 'Yes' : 'No';
    }
    const optionLabel = findOptionLabel(value, widgetConfig);
    if (optionLabel) {
        return optionLabel;
    }
    return String(value);
};
const formatObjectValue = (value, schema, widgetConfig) => {
    const keys = Object.keys(value).sort();
    const rows = [];
    keys.forEach((key) => {
        const childValue = value[key];
        if (isEmptyValue(childValue)) {
            return;
        }
        const childConfig = getChildWidgetConfig(key, schema, widgetConfig);
        const formattedChild = formatValue(childValue, key, schema, childConfig);
        if (formattedChild === EMPTY_PLACEHOLDER) {
            return;
        }
        rows.push(_jsxs("div", { children: [_jsx("dt", { children: getFieldLabel(key, schema, widgetConfig) }), _jsx("dd", { children: formattedChild })] }, key));
    });
    if (rows.length === 0) {
        return EMPTY_PLACEHOLDER;
    }
    return _jsx("dl", { children: rows });
};
export const formatValue = (value, _fieldName, schema, widgetConfig) => {
    if (isEmptyValue(value)) {
        return EMPTY_PLACEHOLDER;
    }
    if (Array.isArray(value)) {
        if (value.length === 0)
            return EMPTY_PLACEHOLDER;
        const arrayContainsOnlyObjects = value.every((item) => isPlainObject(item));
        if (arrayContainsOnlyObjects) {
            const items = value
                .map((item, index) => {
                if (isEmptyValue(item))
                    return null;
                const formatted = formatObjectValue(item, schema, widgetConfig);
                if (formatted === EMPTY_PLACEHOLDER)
                    return null;
                return _jsx("li", { children: formatted }, index);
            })
                .filter(Boolean);
            if (items.length === 0)
                return EMPTY_PLACEHOLDER;
            return _jsx("ol", { children: items });
        }
        const formattedScalars = value.reduce((acc, item) => {
            if (item === null || item === undefined) {
                return acc;
            }
            if (Array.isArray(item) || isPlainObject(item)) {
                const nested = formatValue(item, _fieldName, schema, widgetConfig);
                if (nested !== EMPTY_PLACEHOLDER) {
                    acc.push(nested);
                }
                return acc;
            }
            if (typeof item === 'string' || typeof item === 'number' || typeof item === 'boolean') {
                acc.push(formatPrimitive(item, widgetConfig));
                return acc;
            }
            acc.push(String(item));
            return acc;
        }, []);
        if (formattedScalars.length === 0)
            return EMPTY_PLACEHOLDER;
        if (formattedScalars.every((item) => typeof item === 'string')) {
            return formattedScalars.join(', ');
        }
        return _jsx("ul", { children: formattedScalars.map((item, index) => _jsx("li", { children: item }, index)) });
    }
    if (isPlainObject(value)) {
        return formatObjectValue(value, schema, widgetConfig);
    }
    if (typeof value === 'boolean') {
        return formatPrimitive(value, widgetConfig);
    }
    if (typeof value === 'number') {
        return formatPrimitive(value, widgetConfig);
    }
    if (typeof value === 'string') {
        const trimmed = value.trim();
        if (trimmed.length === 0)
            return EMPTY_PLACEHOLDER;
        const optionLabel = findOptionLabel(value, widgetConfig);
        if (optionLabel) {
            return optionLabel;
        }
        return trimmed;
    }
    return String(value);
};
//# sourceMappingURL=review-format.js.map