'use client';
import { jsx as _jsx } from "react/jsx-runtime";
import * as React from 'react';
import { initializeFieldRegistry } from '../../core/field-registry';
import { useFeatures } from '../../context/features';
import { TextField } from './TextField';
import { withFieldWrapper } from './withFieldWrapper';
const FLAGGED_WIDGETS = {
    AddressLookupUK: 'addressLookupUK',
};
export const FieldFactory = ({ widget, ...props }) => {
    const registry = initializeFieldRegistry();
    const features = useFeatures();
    const requiredFlag = FLAGGED_WIDGETS[widget];
    const isWidgetEnabled = requiredFlag ? features[requiredFlag] : true;
    const registration = React.useMemo(() => {
        if (!isWidgetEnabled && requiredFlag) {
            console.warn(`Widget "${widget}" is disabled by the ${requiredFlag} feature flag. Falling back to default widget.`);
            return undefined;
        }
        return registry.get(widget);
    }, [isWidgetEnabled, registry, requiredFlag, widget]);
    const fallbackRegistration = React.useMemo(() => ({
        component: TextField,
    }), []);
    const resolvedRegistration = React.useMemo(() => {
        if (registration) {
            return {
                component: registration.component,
                defaultProps: registration.defaultProps,
                formatter: registration.formatter,
                parser: registration.parser,
                validator: registration.validator,
            };
        }
        console.warn(`No field component registered for widget: ${widget}. Falling back to Text.`);
        const defaultRegistration = registry.get('Text');
        if (defaultRegistration) {
            return {
                component: defaultRegistration.component,
                defaultProps: defaultRegistration.defaultProps,
                formatter: defaultRegistration.formatter,
                parser: defaultRegistration.parser,
                validator: defaultRegistration.validator,
            };
        }
        return fallbackRegistration;
    }, [fallbackRegistration, registration, registry, widget]);
    const WrappedComponent = React.useMemo(() => withFieldWrapper(resolvedRegistration.component), [resolvedRegistration.component]);
    const mergedProps = React.useMemo(() => ({ ...(resolvedRegistration.defaultProps ?? {}), ...props }), [props, resolvedRegistration.defaultProps]);
    return _jsx(WrappedComponent, { ...mergedProps });
};
//# sourceMappingURL=FieldFactory.js.map