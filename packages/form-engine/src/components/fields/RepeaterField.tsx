'use client';

import * as React from 'react';
import {
  useFormContext,
  useFieldArray,
  type ArrayPath,
  type Control,
  type FieldArray,
  type FieldArrayWithId,
  type FieldValues,
  type Path,
} from 'react-hook-form';

import type { RepeaterItemConfig } from '../../types';
import { cn } from '../../utils/cn';
import { FieldFactory } from './FieldFactory';
import type { FieldProps } from './types';

interface RepeaterComponentProps {
  fields?: RepeaterItemConfig[];
  itemLabel?: string;
  addButtonLabel?: string;
  removeButtonLabel?: string;
  moveUpLabel?: string;
  moveDownLabel?: string;
  emptyStateText?: string;
  minItems?: number;
  maxItems?: number;
  defaultItemValue?: Record<string, unknown>;
}

type RepeaterFieldProps<TFieldValues extends FieldValues = FieldValues> = FieldProps<
  TFieldValues,
  Record<string, unknown> | Record<string, unknown>[]
>;

const ANNOUNCEMENT_RESET_DELAY = 2000;

const getErrorMessage = (error: unknown): string | undefined => {
  if (!error) return undefined;
  if (typeof error === 'string') return error;
  if (typeof error === 'object' && error !== null && 'message' in error) {
    const msg = (error as { message?: unknown }).message;
    return typeof msg === 'string' ? msg : undefined;
  }
  return undefined;
};

const buildDefaultItem = (
  configs: RepeaterItemConfig[],
  fallback?: Record<string, unknown>,
): Record<string, unknown> => {
  const seeded = configs.reduce<Record<string, unknown>>((acc, cfg) => {
    if (cfg.defaultValue !== undefined) acc[cfg.name] = cfg.defaultValue;
    return acc;
  }, {});
  return { ...(fallback ?? {}), ...seeded };
};

export const RepeaterField = <TFieldValues extends FieldValues = FieldValues>(
  props: RepeaterFieldProps<TFieldValues>,
) => {
  const { name, control, componentProps, className, disabled, readOnly, ariaDescribedBy } = props;

  const formContext = useFormContext<TFieldValues>();
  const resolvedControl: Control<TFieldValues> | undefined = control ?? formContext?.control;
  if (!resolvedControl) throw new Error('RepeaterField requires a react-hook-form control.');

  const {
    fields: itemConfigs = [],
    itemLabel = 'Item',
    addButtonLabel,
    removeButtonLabel,
    moveUpLabel,
    moveDownLabel,
    emptyStateText = 'No items yet.',
    minItems,
    maxItems,
    defaultItemValue,
  } = (componentProps ?? {}) as RepeaterComponentProps;

  // A11y live region (polite)
  const liveRegionRef = React.useRef<HTMLDivElement | null>(null);
  const clearTimerRef = React.useRef<number | undefined>(undefined);
  const announce = React.useCallback((message: string) => {
    const region = liveRegionRef.current;
    if (!region) return;
    region.textContent = message;
    if (typeof window !== 'undefined') {
      window.clearTimeout(clearTimerRef.current);
      clearTimerRef.current = window.setTimeout(() => {
        if (region.textContent === message) region.textContent = '';
      }, ANNOUNCEMENT_RESET_DELAY);
    }
  }, []);
  React.useEffect(() => {
    return () => {
      if (typeof window !== 'undefined') window.clearTimeout(clearTimerRef.current);
    };
  }, []);

  const itemFieldConfigs = React.useMemo(
    () =>
      Array.isArray(itemConfigs)
        ? itemConfigs.filter(
            (cfg): cfg is RepeaterItemConfig =>
              Boolean(cfg && typeof cfg.name === 'string' && cfg.component),
          )
        : [],
    [itemConfigs],
  );

  const itemDefaults = React.useMemo(
    () => buildDefaultItem(itemFieldConfigs, defaultItemValue),
    [itemFieldConfigs, defaultItemValue],
  );

  const { fields, append, remove, move } = useFieldArray<TFieldValues, ArrayPath<TFieldValues>>({
    name: name as ArrayPath<TFieldValues>,
    control: resolvedControl,
  });

  // Enforce min items
  React.useEffect(() => {
    if (typeof minItems !== 'number' || minItems <= 0) return;
    if (fields.length >= minItems) return;
    const missing = minItems - fields.length;
    for (let i = 0; i < missing; i += 1) {
      append(itemDefaults as FieldArray<TFieldValues, ArrayPath<TFieldValues>>);
    }
  }, [append, fields.length, itemDefaults, minItems]);

  // Enforce max items
  React.useEffect(() => {
    if (typeof maxItems !== 'number' || maxItems <= 0) return;
    if (fields.length <= maxItems) return;
    const extra = fields.length - maxItems;
    const idxToRemove = Array.from({ length: extra }, (_, pos) => maxItems + pos);
    remove(idxToRemove);
  }, [fields.length, maxItems, remove]);

  const canAdd =
    !disabled && !readOnly && (typeof maxItems !== 'number' || fields.length < maxItems);
  const canRemove =
    !disabled && !readOnly && (typeof minItems !== 'number' || fields.length > minItems);
  const canReorder = !disabled && !readOnly && fields.length > 1;

  const handleAddItem = React.useCallback(() => {
    if (!canAdd) return;
    append(itemDefaults as FieldArray<TFieldValues, ArrayPath<TFieldValues>>);
    announce(`${itemLabel} ${fields.length + 1} added.`);
  }, [append, canAdd, fields.length, itemDefaults, itemLabel, announce]);

  const handleRemoveItem = React.useCallback(
    (index: number) => {
      if (!canRemove) return;
      remove(index);
      announce(`${itemLabel} ${index + 1} removed.`);
    },
    [canRemove, remove, itemLabel, announce],
  );

  const handleMoveItem = React.useCallback(
    (from: number, to: number) => {
      if (!canReorder) return;
      move(from, to);
      announce(`${itemLabel} ${from + 1} moved to position ${to + 1}.`);
    },
    [canReorder, move, itemLabel, announce],
  );

  const getFieldError = React.useCallback(
    (fieldName: string) => {
      if (!formContext) return undefined;
      const fieldState = formContext.getFieldState(
        fieldName as Path<TFieldValues>,
        formContext.formState,
      );
      return getErrorMessage(fieldState.error);
    },
    [formContext],
  );

  const addLabel = addButtonLabel ?? `Add ${itemLabel}`;
  const removeLabel = removeButtonLabel ?? 'Remove';
  const moveUpBtnLabel = moveUpLabel ?? 'Move up';
  const moveDownBtnLabel = moveDownLabel ?? 'Move down';

  return (
    <div className={cn('space-y-4', className)} data-repeater>
      <div aria-live="polite" aria-atomic="true" className="sr-only" ref={liveRegionRef} />

      {fields.length === 0 ? (
        <div className="rounded-md border border-dashed border-muted-foreground/50 p-4 text-sm text-muted-foreground">
          {emptyStateText}
        </div>
      ) : (
        <ul className="space-y-4" role="list">
          {fields.map((field: FieldArrayWithId<TFieldValues, ArrayPath<TFieldValues>>, index) => {
            const itemNumber = index + 1;
            return (
              <li
                key={field.id}
                className="rounded-md border border-border bg-muted/10 p-4 shadow-sm"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <p className="text-sm font-medium text-foreground">
                    {itemLabel} {itemNumber}
                  </p>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      className="rounded-md border border-input px-2 py-1 text-xs font-medium text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-60"
                      onClick={() => handleRemoveItem(index)}
                      disabled={!canRemove}
                    >
                      {removeLabel}
                    </button>
                    <button
                      type="button"
                      className="rounded-md border border-input px-2 py-1 text-xs font-medium text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-60"
                      onClick={() => handleMoveItem(index, index - 1)}
                      disabled={!canReorder || index === 0}
                      aria-label={`${moveUpBtnLabel} ${itemLabel} ${itemNumber}`}
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      className="rounded-md border border-input px-2 py-1 text-xs font-medium text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-60"
                      onClick={() => handleMoveItem(index, index + 1)}
                      disabled={!canReorder || index === fields.length - 1}
                      aria-label={`${moveDownBtnLabel} ${itemLabel} ${itemNumber}`}
                    >
                      ↓
                    </button>
                  </div>
                </div>

                <div className="mt-4 space-y-4">
                  {itemFieldConfigs.map((cfg) => {
                    const {
                      component,
                      name: itemFieldName,
                      label,
                      placeholder,
                      description,
                      helpText,
                      className: itemClassName,
                      options,
                      disabled: itemDisabled,
                      readOnly: itemReadOnly,
                      required,
                      ...rest
                    } = cfg;

                    const fieldName = `${name}.${index}.${itemFieldName}`;
                    const nestedError = getFieldError(fieldName);

                    return (
                      <FieldFactory
                        key={`${field.id}-${itemFieldName}`}
                        name={fieldName}
                        widget={component ?? 'Text'}
                        label={label}
                        placeholder={placeholder}
                        description={description}
                        helpText={helpText}
                        className={itemClassName as string | undefined}
                        disabled={disabled || itemDisabled}
                        readOnly={readOnly || itemReadOnly}
                        required={required}
                        control={resolvedControl as unknown as Control<FieldValues>}
                        options={options}
                        componentProps={rest as Record<string, unknown>}
                        error={nestedError}
                      />
                    );
                  })}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <div>
        <button
          type="button"
          className="rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-60"
          onClick={handleAddItem}
          disabled={!canAdd}
          aria-describedby={ariaDescribedBy}
        >
          {addLabel}
        </button>
      </div>
    </div>
  );
};

RepeaterField.displayName = 'RepeaterField';