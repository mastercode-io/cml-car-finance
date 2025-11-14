'use client';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { PersistenceManager } from './PersistenceManager';
function resolveEncryptionKey(options) {
    if (options.encryptionKey) {
        return options.encryptionKey;
    }
    if (options.sensitivity !== 'high') {
        return undefined;
    }
    if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
        const buffer = new Uint8Array(16);
        crypto.getRandomValues(buffer);
        return Array.from(buffer)
            .map((byte) => byte.toString(16).padStart(2, '0'))
            .join('');
    }
    return Math.random().toString(36).slice(2);
}
export function useAutosave(formId, schemaVersion, formData, currentStep, completedSteps, options = {}) {
    const { enabled = true, interval = 5000, onSave, onError, sensitivity = 'low', ttlDays, userId, } = options;
    const providedEncryptionKey = options.encryptionKey;
    const encryptionKey = useMemo(() => resolveEncryptionKey({ sensitivity, encryptionKey: providedEncryptionKey }), [providedEncryptionKey, sensitivity]);
    const [state, setState] = useState({
        lastSaved: null,
        isSaving: false,
        saveCount: 0,
        error: null,
    });
    const managerRef = useRef(null);
    const timerRef = useRef(null);
    const autosaveEnabled = enabled !== false;
    const loadDraft = useCallback(async () => {
        try {
            const draft = await managerRef.current?.loadDraft();
            if (!draft) {
                return;
            }
            if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
                const event = new CustomEvent('draftLoaded', {
                    detail: draft,
                });
                window.dispatchEvent(event);
            }
        }
        catch (error) {
            console.error('Failed to load draft', error);
        }
    }, []);
    useEffect(() => {
        managerRef.current = new PersistenceManager({
            formId,
            schemaVersion,
            allowAutosave: autosaveEnabled,
            sensitivity,
            ttlDays,
            userId,
            encryptionKey,
        });
        void loadDraft();
        return () => {
            if (timerRef.current) {
                clearTimeout(timerRef.current);
            }
            managerRef.current = null;
        };
    }, [
        autosaveEnabled,
        encryptionKey,
        formId,
        loadDraft,
        schemaVersion,
        sensitivity,
        ttlDays,
        userId,
    ]);
    const saveDraftInternal = useCallback(async (immediate) => {
        if (!managerRef.current || !autosaveEnabled) {
            return;
        }
        setState((prev) => ({ ...prev, isSaving: true, error: null }));
        try {
            await managerRef.current.saveDraft(formData, currentStep, completedSteps, {
                manual: immediate,
                immediate,
            });
            if (immediate) {
                await managerRef.current.flushPendingSaves();
            }
            setState((prev) => ({
                ...prev,
                isSaving: false,
                lastSaved: new Date(),
                saveCount: prev.saveCount + 1,
            }));
            onSave?.();
        }
        catch (error) {
            const err = error;
            setState((prev) => ({ ...prev, isSaving: false, error: err }));
            onError?.(err);
        }
    }, [autosaveEnabled, completedSteps, currentStep, formData, onError, onSave]);
    useEffect(() => {
        if (!autosaveEnabled) {
            return undefined;
        }
        if (timerRef.current) {
            clearTimeout(timerRef.current);
        }
        timerRef.current = setTimeout(() => {
            void saveDraftInternal(false);
        }, interval);
        return () => {
            if (timerRef.current) {
                clearTimeout(timerRef.current);
                timerRef.current = null;
            }
        };
    }, [autosaveEnabled, completedSteps, currentStep, formData, interval, saveDraftInternal]);
    const saveDraft = useCallback(async () => {
        await saveDraftInternal(true);
    }, [saveDraftInternal]);
    const clearDraft = useCallback(async () => {
        try {
            await managerRef.current?.deleteDraft();
            setState((prev) => ({ ...prev, lastSaved: null, saveCount: 0 }));
        }
        catch (error) {
            console.error('Failed to clear draft', error);
        }
    }, []);
    return {
        ...state,
        saveDraft,
        clearDraft,
        loadDraft,
    };
}
//# sourceMappingURL=useAutosave.js.map