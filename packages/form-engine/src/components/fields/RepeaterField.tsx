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

import { cn } from '../../utils/cn';
import type { RepeaterItemConfig, WidgetType } from '../../types';
import type { FieldProps } from './types';
import { FieldFactory } from './FieldFactory';

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

const buildDefaultItem = (
  configs: RepeaterItemConfig[],
  fallback: Record<string, unknown> | undefined,
): Record<string, unknown> => {
  const base: Record<string, unknown> = {};

  configs.forEach((config) => {
    if (config.defaultValue !== undefined) {
      base[config.name] = config.defaultValue;
    }
  });

  return { ...(fallback ?? {}), ...base };
};

export const RepeaterField = <TFieldValues extends FieldValues = FieldValues>(
  props: RepeaterFieldProps<TFieldValues>,
) => {
  const { name, control, componentProps, ariaDescribedBy, className, disabled, readOnly } = props;

  const formContext = useFormContext<TFieldValues>();
  const resolvedControl: Control<TFieldValues> | undefined = control ?? formContext?.control;

  if (!resolvedControl) {
    throw new Error('RepeaterField requires a react-hook-form control.');
  }

  const {
    fields: itemConfigs = [],
    itemLabel: itemLabelProp = 'Item',
    addButtonLabel: addLabelProp,
    removeButtonLabel: removeLabelProp,
    moveUpLabel: moveUpLabelProp,
    moveDownLabel: moveDownLabelProp,
    emptyStateText = 'No items have been added yet.',
    minItems,
    maxItems,
    defaultItemValue,
  } = (componentProps ?? {}) as RepeaterComponentProps;

  const [announcement, setAnnouncement] = React.useState('');
  const liveRegionRef = React.useRef<HTMLDivElement | null>(null);

  const resolvedItemLabel = itemLabelProp || 'Item';

  const fieldArray = useFieldArray<TFieldValues, ArrayPath<TFieldValues>>({
    name: name as ArrayPath<TFieldValues>,
    control: resolvedControl,
  });
  const { fields, append, remove, move } = fieldArray;

  const itemFieldConfigs = React.useMemo(() => {
    return Array.isArray(itemConfigs)
      ? itemConfigs
          .filter((config): config is RepeaterItemConfig =>
            Boolean(config && typeof config.name === 'string' && config.component),
          )
          .map((config) => ({
            ...config,
            component: config.component ?? ('Text' as WidgetType),
          }))
      : [];
  }, [itemConfigs]);

  const itemDefaults = React.useMemo(
    () => buildDefaultItem(itemFieldConfigs, defaultItemValue),
    [defaultItemValue, itemFieldConfigs],
  );

  React.useEffect(() => {
    if (typeof minItems !== 'number' || minItems <= 0) {
      return;
    }
    if (fields.length >= minItems) {
      return;
    }

    const missing = minItems - fields.length;
    for (let index = 0; index < missing; index += 1) {
      append(itemDefaults as FieldArray<TFieldValues, ArrayPath<TFieldValues>>);
    }
  }, [append, fields.length, itemDefaults, minItems]);

  React.useEffect(() => {
    if (typeof maxItems !== 'number' || maxItems <= 0) {
      return;
    }
    if (fields.length <= maxItems) {
      return;
    }

    const extraCount = fields.length - maxItems;
    const indexesToRemove = Array.from(
      { length: extraCount },
      (_, position) => maxItems + position,
    );
    remove(indexesToRemove);
  }, [fields.length, maxItems, remove]);

  React.useEffect(() => {
    if (announcement && liveRegionRef.current) {
      const region = liveRegionRef.current;
      region.textContent = announcement;

      if (typeof window !== 'undefined') {
        const timeout = window.setTimeout(() => {
          region.textContent = '';
        }, 2000);

        return () => {
          window.clearTimeout(timeout);
        };
      }

      return () => {
        region.textContent = '';
      };
    }

    return undefined;
  }, [announcement]);

  const canAdd =
    !disabled && !readOnly && (typeof maxItems !== 'number' || fields.length < maxItems);
  const canRemove =
    !disabled && !readOnly && (typeof minItems !== 'number' || fields.length > minItems);
  const canReorder = fields.length > 1 && !disabled && !readOnly;

  const handleAddItem = React.useCallback(() => {
    if (!canAdd) {
      return;
    }
    append(itemDefaults as FieldArray<TFieldValues, ArrayPath<TFieldValues>>);
    setAnnouncement(`${resolvedItemLabel} ${fields.length + 1} added.`);
  }, [append, canAdd, fields.length, itemDefaults, resolvedItemLabel]);

  const handleRemoveItem = React.useCallback(
    (index: number) => {
      if (!canRemove) {
        return;
      }
      remove(index);
      setAnnouncement(`${resolvedItemLabel} ${index + 1} removed.`);
    },
    [canRemove, remove, resolvedItemLabel],
  );

  const handleMoveItem = React.useCallback(
    (from: number, to: number) => {
      if (!canReorder) {
        return;
      }
      move(from, to);
      setAnnouncement(`${resolvedItemLabel} ${from + 1} moved to position ${to + 1}.`);
    },
    [canReorder, move, resolvedItemLabel],
  );

  const getFieldError = React.useCallback(
    (fieldName: string) => {
      if (!formContext) {
        return undefined;
      }
      const fieldState = formContext.getFieldState(
        fieldName as Path<TFieldValues>,
        formContext.formState,
      );
      return getErrorMessage(fieldState.error);
    },
    [formContext],
  );

  const addLabel = addLabelProp ?? `Add ${resolvedItemLabel}`;
  const removeLabel = removeLabelProp ?? 'Remove';
  const moveUpLabel = moveUpLabelProp ?? 'Move up';
  const moveDownLabel = moveDownLabelProp ?? 'Move down';

  return (
    <div className={cn('space-y-4', className)} data-repeater>
      <div aria-live="polite" aria-atomic="true" className="sr-only" ref={liveRegionRef} />

      {fields.length === 0 ? (
        <div className="rounded-md border border-dashed border-muted-foreground/50 p-4 text-sm text-muted-foreground">
          {emptyStateText}
        </div>
      ) : (
        <ul className="space-y-4" role="list">
          {fields.map((field: FieldArrayWithId<TFieldValues, ArrayPath<TFieldValues>>, index) => (
            <li
              key={field.id}
              className="rounded-md border border-border bg-muted/10 p-4 shadow-sm"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {resolvedItemLabel} {index + 1}
                  </p>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  <button
                    type="button"
                    className="rounded-md border border-input px-2 py-1 text-xs font-medium text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    onClick={() => handleRemoveItem(index)}
                    disabled={!canRemove}
                  >
                    {removeLabel}
                  </button>
                  <button
                    type="button"
                    className="rounded-md border border-input px-2 py-1 text-xs font-medium text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    onClick={() => handleMoveItem(index, index - 1)}
                    disabled={!canReorder || index === 0}
                    aria-label={`${moveUpLabel} ${resolvedItemLabel} ${index + 1}`}
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    className="rounded-md border border-input px-2 py-1 text-xs font-medium text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    onClick={() => handleMoveItem(index, index + 1)}
                    disabled={!canReorder || index === fields.length - 1}
                    aria-label={`${moveDownLabel} ${resolvedItemLabel} ${index + 1}`}
                  >
                    ↓
                  </button>
                </div>
              </div>

              <div className="mt-4 space-y-4">
                {itemFieldConfigs.map((itemConfig) => {
                  const {
                    component,
                    label,
                    placeholder,
                    description,
                    helpText,
                    className: itemClassName,
                    options,
                    disabled: itemDisabled,
                    readOnly: itemReadOnly,
                    required,
                    ...restItemProps
                  } = itemConfig;

                  const fieldName = `${name}.${index}.${itemConfig.name}`;
                  const nestedError = getFieldError(fieldName);

                  return (
                    <FieldFactory
                      key={`${field.id}-${itemConfig.name}`}
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
                      componentProps={restItemProps as Record<string, unknown>}
                      error={nestedError}
                    />
                  );
                })}
              </div>
            </li>
          ))}
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
