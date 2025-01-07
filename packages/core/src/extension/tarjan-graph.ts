import { AnyObj } from '#types/mix.js';

export type GroupConfig<T> = {
  group: T;
  beforeGroup?: T;
  afterGroup?: T;
};

export type Graph<T> = Map<T, T[]>;

export function getGraph<T>(configs: AnyObj[]): { graph: Graph<T>; origin: Set<T> } {
  const graph = new Map() as Graph<T>;
  const origin = new Set<T>(configs.map((config) => config.group));
  for (const config of configs) {
    if (!isGroupConfig<T>(config)) {
      continue;
    }
    const { group, beforeGroup, afterGroup } = config;
    if (!graph.has(group)) {
      graph.set(group, []);
    }
    if (beforeGroup && origin.has(beforeGroup)) {
      if (!graph.has(beforeGroup)) {
        graph.set(beforeGroup, []);
      }
      graph.get(beforeGroup)!.push(group); // Adding a dependency.
    }
    if (afterGroup && origin.has(afterGroup)) {
      if (!graph.has(afterGroup)) {
        graph.set(afterGroup, []);
      }
      graph.get(group)!.push(afterGroup); // Adding a dependency.
    }
  }

  return { origin, graph };
}

export function findCycle<T>(configs: GroupConfig<T>[]): T[] | null {
  const { origin, graph } = getGraph(configs);
  const visited = new Set<T>();
  const stack = new Set<T>();
  const path: T[] = [];

  for (const group of origin) {
    if (dfsWithPath(group, graph, visited, stack, path)) {
      return path;
    }
  }
  return null;
}

function dfsWithPath<T>(group: T, graph: Graph<T>, visited: Set<T>, stack: Set<T>, path: T[]): boolean {
  if (stack.has(group)) {
    path.push(group);
    return true; // Cycle found
  }

  if (visited.has(group)) {
    return false; // There is no cycle here
  }

  visited.add(group);
  stack.add(group);

  for (const neighbor of graph.get(group) || []) {
    if (dfsWithPath(neighbor, graph, visited, stack, path)) {
      path.push(group);
      return true;
    }
  }

  stack.delete(group);
  return false;
}

export function isGroupConfig<T>(groupConfig: AnyObj): groupConfig is GroupConfig<T> {
  return Boolean((groupConfig as GroupConfig<T>).group);
}
