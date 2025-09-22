'use client';

import * as React from 'react';
import {
  type ArrayPath,
  type Control,
  type FieldArray,
  type FieldArrayWithId,
  type FieldValues,
  type Path,
  useFieldArray,
  useFormContext,
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

const ANNOUNCEMENT_RESET_DELAY = 1500;
const DEFAULT_EMPTY_TEXT = 'No items yet.';
const DEFAULT_ITEM_LABEL = 'Item';
const DEFAULT_REMOVE_LABEL = 'Remove';
const DEFAULT_MOVE_UP_LABEL = 'Move up';
const DEFAULT_MOVE_DOWN_LABEL = 'Move down';

const buildDefaultItem = (
  configs: RepeaterItemConfig[],
  fallback?: Record<string, unknown>,
): Record<string, unknown> => {
  const seededFromConfig = configs.reduce<Record<string, unknown>>((acc, config) => {
    if (config.defaultValue !== undefined) {
      acc[config.name] = config.defaultValue;
    }
    return acc;
  }, {});

  return {
    ...(fallback ?? {}),
    ...seededFromConfig,
  };
};

const getErrorMessage = (error: unknown): string | undefined => {
  if (!error) {
    return undefined;
  }

  if (typeof error === 'string') {
    return error;
  }

  if (typeof error === 'object' && error !== null && 'message' in error) {
    const message = (error as { message?: unknown }).message;
    return typeof message === 'string' ? message : undefined;
  }

  return undefined;
};

export const RepeaterField = <TFieldValues extends FieldValues = FieldValues>({
  name,
  control,
  componentProps,
  className,
  disabled,
  readOnly,
  ariaDescribedBy,
}: FieldProps<TFieldValues, Record<string, unknown> | Record<string, unknown>[]>) => {
  const form = useFormContext<TFieldValues>();
  const resolvedControl: Control<TFieldValues> | undefined = control ?? form?.control;

  if (!resolvedControl) {
    throw new Error('RepeaterField requires a react-hook-form control.');
  }

  const {
    fields: configuredFields = [],
    itemLabel = DEFAULT_ITEM_LABEL,
    addButtonLabel,
    removeButtonLabel,
    moveUpLabel,
    moveDownLabel,
    emptyStateText = DEFAULT_EMPTY_TEXT,
    minItems,
    maxItems,
    defaultItemValue,
  } = (componentProps ?? {}) as RepeaterComponentProps;

  const liveRegionRef = React.useRef<HTMLDivElement | null>(null);
  const resetTimerRef = React.useRef<number | undefined>(undefined);

  const announce = React.useCallback((message: string) => {
    const region = liveRegionRef.current;
    if (!region) {
      return;
    }

    region.textContent = message;

    if (typeof window !== 'undefined') {
      window.clearTimeout(resetTimerRef.current);
      resetTimerRef.current = window.setTimeout(() => {
        if (region.textContent === message) {
          region.textContent = '';
        }
      }, ANNOUNCEMENT_RESET_DELAY);
    }
  }, []);

  React.useEffect(() => {
    return () => {
      if (typeof window !== 'undefined') {
        window.clearTimeout(resetTimerRef.current);
      }
    };
  }, []);

  const normalizedItemConfigs = React.useMemo(
    () =>
      Array.isArray(configuredFields)
        ? configuredFields.filter((config): config is RepeaterItemConfig =>
            Boolean(config?.name && config?.component),
          )
        : [],
    [configuredFields],
  );

  const defaultItem = React.useMemo(
    () => buildDefaultItem(normalizedItemConfigs, defaultItemValue),
    [defaultItemValue, normalizedItemConfigs],
  );

  const fieldArray = useFieldArray<TFieldValues, ArrayPath<TFieldValues>>({
    name: name as ArrayPath<TFieldValues>,
    control: resolvedControl,
  });

  const { fields, append, remove, move } = fieldArray;

  React.useEffect(() => {
    if (typeof minItems !== 'number' || minItems <= 0) {
      return;
    }

    if (fields.length >= minItems) {
      return;
    }

    const missing = minItems - fields.length;
    for (let index = 0; index < missing; index += 1) {
      append(defaultItem as FieldArray<TFieldValues, ArrayPath<TFieldValues>>);
    }
  }, [append, defaultItem, fields.length, minItems]);

  React.useEffect(() => {
    if (typeof maxItems !== 'number' || maxItems <= 0) {
      return;
    }

    if (fields.length <= maxItems) {
      return;
    }

    const overflow = fields.length - maxItems;
    const indexesToRemove = Array.from({ length: overflow }, (_, position) => maxItems + position);
    remove(indexesToRemove);
  }, [fields.length, maxItems, remove]);

  const canAdd =
    !disabled && !readOnly && (typeof maxItems !== 'number' || fields.length < maxItems);
  const canRemove =
    !disabled && !readOnly && (typeof minItems !== 'number' || fields.length > minItems);
  const canReorder = !disabled && !readOnly && fields.length > 1;

  const handleAdd = React.useCallback(() => {
    if (!canAdd) {
      return;
    }

    append(defaultItem as FieldArray<TFieldValues, ArrayPath<TFieldValues>>);
    announce(`${itemLabel} ${fields.length + 1} added.`);
  }, [announce, append, canAdd, defaultItem, fields.length, itemLabel]);

  const handleRemove = React.useCallback(
    (index: number) => {
      if (!canRemove) {
        return;
      }

      remove(index);
      announce(`${itemLabel} ${index + 1} removed.`);
    },
    [announce, canRemove, itemLabel, remove],
  );

  const handleMove = React.useCallback(
    (from: number, to: number) => {
      if (!canReorder) {
        return;
      }

      move(from, to);
      announce(`${itemLabel} ${from + 1} moved to position ${to + 1}.`);
    },
    [announce, canReorder, itemLabel, move],
  );

  const getNestedError = React.useCallback(
    (fieldName: string) => {
      if (!form) {
        return undefined;
      }

      const fieldState = form.getFieldState(fieldName as Path<TFieldValues>, form.formState);
      return getErrorMessage(fieldState.error);
    },
    [form],
  );

  const addLabel = addButtonLabel ?? `Add ${itemLabel}`;
  const removeLabel = removeButtonLabel ?? DEFAULT_REMOVE_LABEL;
  const moveUpButtonLabel = moveUpLabel ?? DEFAULT_MOVE_UP_LABEL;
  const moveDownButtonLabel = moveDownLabel ?? DEFAULT_MOVE_DOWN_LABEL;

  return (
    <div className={cn('space-y-4', className)} data-repeater>
      <div aria-live="polite" aria-atomic="true" className="sr-only" ref={liveRegionRef} />

      {fields.length === 0 ? (
        <div className="rounded-md border border-dashed border-muted-foreground/40 p-4 text-sm text-muted-foreground">
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
                      onClick={() => handleRemove(index)}
                      disabled={!canRemove}
                    >
                      {removeLabel}
                    </button>
                    <button
                      type="button"
                      className="rounded-md border border-input px-2 py-1 text-xs font-medium text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-60"
                      onClick={() => handleMove(index, index - 1)}
                      disabled={!canReorder || index === 0}
                      aria-label={`${moveUpButtonLabel} ${itemLabel} ${itemNumber}`}
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      className="rounded-md border border-input px-2 py-1 text-xs font-medium text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-60"
                      onClick={() => handleMove(index, index + 1)}
                      disabled={!canReorder || index === fields.length - 1}
                      aria-label={`${moveDownButtonLabel} ${itemLabel} ${itemNumber}`}
                    >
                      ↓
                    </button>
                  </div>
                </div>

                <div className="mt-4 space-y-4">
                  {normalizedItemConfigs.map((config) => {
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
                      ...restComponentProps
                    } = config;

                    const fieldName = `${name}.${index}.${itemFieldName}`;
                    const nestedError = getNestedError(fieldName);

                    return (
                      <FieldFactory
                        key={`${field.id}-${itemFieldName}`}
                        name={fieldName}
                        widget={component}
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
                        componentProps={restComponentProps as Record<string, unknown>}
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
          onClick={handleAdd}
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
