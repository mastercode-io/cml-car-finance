import type { StepTransition, UnifiedFormSchema, ValidationError } from '../types';

export interface NavigationLintResult {
  errors: ValidationError[];
  warnings: ValidationError[];
}

type IndexedTransition = StepTransition & { index: number };

type Graph = Map<string, IndexedTransition[]>;

export const lintNavigationSchema = (schema: UnifiedFormSchema): NavigationLintResult => {
  const errors: ValidationError[] = [];
  const warnings: ValidationError[] = [];

  const stepIds = schema.steps?.map((step) => step.id) ?? [];
  const stepSet = new Set(stepIds);
  const transitions = (schema.transitions ?? []).map((transition, index) => ({
    ...transition,
    index,
  }));

  detectDuplicateSteps(stepIds, errors);
  detectMultipleDefaults(transitions, errors);
  detectUnknownReferences(transitions, stepSet, errors);
  detectCycles(transitions, stepSet, errors);
  detectMissingTerminals(stepIds, transitions, stepSet, warnings);

  return { errors, warnings };
};

const detectDuplicateSteps = (stepIds: string[], errors: ValidationError[]) => {
  const seen = new Set<string>();
  const duplicates = new Set<string>();

  stepIds.forEach((id) => {
    if (seen.has(id)) {
      duplicates.add(id);
    } else {
      seen.add(id);
    }
  });

  duplicates.forEach((id) => {
    errors.push({
      path: `/steps/${id}`,
      message: `Duplicate step id detected: ${id}`,
      keyword: 'navigation:duplicate-step',
      property: id,
    });
  });
};

const detectMultipleDefaults = (
  transitions: IndexedTransition[],
  errors: ValidationError[],
) => {
  const byFrom = new Map<string, IndexedTransition[]>();

  transitions.forEach((transition) => {
    const list = byFrom.get(transition.from) ?? [];
    list.push(transition);
    byFrom.set(transition.from, list);
  });

  byFrom.forEach((list, from) => {
    const defaultTransitions = list.filter((transition) => transition.default);
    if (defaultTransitions.length > 1) {
      const indices = defaultTransitions.map((transition) => transition.index).join(', ');
      errors.push({
        path: `/transitions/${from}`,
        message: `Multiple default transitions defined for step "${from}" (indices: ${indices}).`,
        keyword: 'navigation:multiple-defaults',
        property: from,
      });
    }
  });
};

const detectUnknownReferences = (
  transitions: IndexedTransition[],
  stepSet: Set<string>,
  errors: ValidationError[],
) => {
  transitions.forEach((transition) => {
    if (!stepSet.has(transition.from)) {
      errors.push({
        path: `/transitions/${transition.index}`,
        message: `Transition references unknown step in "from": ${transition.from}`,
        keyword: 'navigation:unknown-from',
        property: transition.from,
      });
    }

    if (!stepSet.has(transition.to)) {
      errors.push({
        path: `/transitions/${transition.index}`,
        message: `Transition references unknown step in "to": ${transition.to}`,
        keyword: 'navigation:unknown-to',
        property: transition.to,
      });
    }
  });
};

const detectCycles = (
  transitions: IndexedTransition[],
  stepSet: Set<string>,
  errors: ValidationError[],
) => {
  if (transitions.length === 0 || stepSet.size === 0) {
    return;
  }

  const graph: Graph = new Map();
  transitions.forEach((transition) => {
    if (!graph.has(transition.from)) {
      graph.set(transition.from, []);
    }

    graph.get(transition.from)!.push(transition);
  });

  const visiting = new Set<string>();
  const visited = new Set<string>();
  const stack: Array<{ node: string; via?: IndexedTransition }> = [];
  const recordedCycles = new Set<string>();

  const recordCycle = (cycleEdges: IndexedTransition[]) => {
    const key = cycleEdges
      .map((edge) => `${edge.from}->${edge.to}#${edge.index}`)
      .sort()
      .join('|');
    if (recordedCycles.has(key)) {
      return;
    }

    recordedCycles.add(key);
    const isAllowed = cycleEdges.some((edge) => edge.allowCycle === true);
    if (!isAllowed) {
      const cyclePath = cycleEdges.map((edge) => `${edge.from}->${edge.to}`).join(' -> ');
      errors.push({
        path: '/transitions',
        message: `Cycle detected without allowCycle override: ${cyclePath}`,
        keyword: 'navigation:cycle',
      });
    }
  };

  const dfs = (node: string) => {
    visiting.add(node);
    stack.push({ node });

    const edges = graph.get(node) ?? [];
    for (const edge of edges) {
      if (!stepSet.has(edge.to)) {
        continue;
      }

      if (visiting.has(edge.to)) {
        const cycleEdges: IndexedTransition[] = [edge];
        for (let i = stack.length - 1; i >= 0; i -= 1) {
          const via = stack[i]?.via;
          if (!via) {
            continue;
          }

          cycleEdges.push(via);
          if (via.from === edge.to) {
            break;
          }
        }

        cycleEdges.reverse();
        recordCycle(cycleEdges);
        continue;
      }

      if (!visited.has(edge.to)) {
        stack.push({ node: edge.to, via: edge });
        dfs(edge.to);
        stack.pop();
      }
    }

    stack.pop();
    visiting.delete(node);
    visited.add(node);
  };

  stepSet.forEach((node) => {
    if (!visited.has(node)) {
      dfs(node);
    }
  });
};

const detectMissingTerminals = (
  stepIds: string[],
  transitions: IndexedTransition[],
  stepSet: Set<string>,
  warnings: ValidationError[],
) => {
  if (stepIds.length === 0) {
    return;
  }

  const adjacency = new Map<string, string[]>();
  transitions.forEach((transition) => {
    if (!stepSet.has(transition.from) || !stepSet.has(transition.to)) {
      return;
    }
    const list = adjacency.get(transition.from) ?? [];
    list.push(transition.to);
    adjacency.set(transition.from, list);
  });

  const start = stepIds[0]!;
  const reachable = new Set<string>();
  const queue: string[] = [start];

  while (queue.length > 0) {
    const current = queue.shift()!;
    if (reachable.has(current)) {
      continue;
    }

    reachable.add(current);
    const neighbors = adjacency.get(current) ?? [];
    neighbors.forEach((neighbor) => {
      if (!reachable.has(neighbor)) {
        queue.push(neighbor);
      }
    });
  }

  const terminals = [...reachable].filter((id) => (adjacency.get(id) ?? []).length === 0);
  if (terminals.length === 0) {
    warnings.push({
      path: '/transitions',
      message: 'No reachable terminal steps detected from the entry step.',
      keyword: 'navigation:no-terminal',
    });
  }
};
