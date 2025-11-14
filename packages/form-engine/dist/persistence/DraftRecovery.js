'use client';
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { AlertCircle } from 'lucide-react';
import { PersistenceManager } from './PersistenceManager';
export const DraftRecovery = ({ draft, onRecover, onDiscard }) => {
    const [isVisible, setIsVisible] = useState(true);
    const timeSinceUpdate = useMemo(() => formatDistanceToNow(new Date(draft.metadata.updatedAt), {
        addSuffix: true,
    }), [draft.metadata.updatedAt]);
    if (!isVisible) {
        return null;
    }
    return (_jsxs("div", { className: "mb-4 rounded-md border border-yellow-300 bg-yellow-50 p-4 text-sm text-yellow-900", children: [_jsxs("div", { className: "mb-2 flex items-center gap-2 font-semibold", children: [_jsx(AlertCircle, { className: "h-4 w-4", "aria-hidden": "true" }), "Unsaved Draft Found"] }), _jsxs("p", { className: "mb-3", children: ["You have an unsaved draft from ", timeSinceUpdate, ". Would you like to continue where you left off?"] }), _jsxs("div", { className: "flex gap-2", children: [_jsx("button", { type: "button", className: "rounded bg-blue-600 px-3 py-1 text-white transition-colors hover:bg-blue-700", onClick: () => {
                            onRecover(draft.data);
                            setIsVisible(false);
                        }, children: "Recover Draft" }), _jsx("button", { type: "button", className: "rounded border border-blue-600 px-3 py-1 text-blue-600 transition-colors hover:bg-blue-50", onClick: () => {
                            onDiscard();
                            setIsVisible(false);
                        }, children: "Start Fresh" })] })] }));
};
export const DraftManagementDialog = ({ formId, onSelectDraft, }) => {
    const managerRef = useRef(null);
    const [drafts, setDrafts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    if (!managerRef.current) {
        managerRef.current = new PersistenceManager({
            formId,
            schemaVersion: '*',
            allowAutosave: false,
        });
    }
    const loadDrafts = useCallback(async () => {
        setIsLoading(true);
        try {
            const manager = managerRef.current;
            if (!manager) {
                return;
            }
            const results = await manager.getAllDrafts();
            const filtered = results.filter(({ draft }) => draft.formId === formId);
            setDrafts(filtered);
        }
        catch (error) {
            console.error('Failed to load drafts', error);
        }
        finally {
            setIsLoading(false);
        }
    }, [formId]);
    useEffect(() => {
        void loadDrafts();
    }, [loadDrafts]);
    const handleDelete = useCallback(async (draft) => {
        try {
            await managerRef.current?.deleteDraftByKey(draft.key);
            await loadDrafts();
        }
        catch (error) {
            console.error('Failed to delete draft', error);
        }
    }, [loadDrafts]);
    if (isLoading) {
        return _jsx("div", { children: "Loading drafts..." });
    }
    if (drafts.length === 0) {
        return _jsx("div", { children: "No drafts found" });
    }
    return (_jsxs("div", { className: "space-y-3 rounded-md border border-slate-200 p-4", children: [_jsx("h3", { className: "text-base font-semibold", children: "Available Drafts" }), drafts.map((entry) => (_jsxs("div", { className: "flex flex-col gap-3 rounded border border-slate-200 p-3", children: [_jsxs("div", { children: [_jsxs("p", { className: "font-medium", children: ["Version ", entry.draft.schemaVersion] }), _jsxs("p", { className: "text-xs text-slate-600", children: ["Last updated", ' ', formatDistanceToNow(new Date(entry.draft.metadata.updatedAt), {
                                        addSuffix: true,
                                    })] }), _jsxs("p", { className: "text-xs text-slate-600", children: ["Progress: Step ", entry.draft.currentStep, " (", entry.draft.completedSteps.length, ' ', "completed)"] })] }), _jsxs("div", { className: "flex gap-2", children: [_jsx("button", { type: "button", className: "rounded bg-slate-900 px-3 py-1 text-white transition-colors hover:bg-slate-700", onClick: () => onSelectDraft(entry.draft, entry.key), children: "Load" }), _jsx("button", { type: "button", className: "rounded border border-slate-900 px-3 py-1 text-slate-900 transition-colors hover:bg-slate-100", onClick: () => void handleDelete(entry), children: "Delete" })] })] }, entry.key)))] }));
};
//# sourceMappingURL=DraftRecovery.js.map