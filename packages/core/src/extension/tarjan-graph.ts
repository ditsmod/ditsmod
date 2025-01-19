import { AnyObj } from '#types/mix.js';
import { isExtensionConfig } from './type-guards.js';

export type ExtensionConfig<T> = {
  extension: T;
  beforeExtensions?: T[];
  afterExtensions?: T[];
};

export type Graph<T> = Map<T, T[]>;

export function getGraph<T>(configs: (ExtensionConfig<T> | AnyObj)[]): { graph: Graph<T>; origin: Set<T> } {
  const graph = new Map() as Graph<T>;
  const origin = new Set<T>(configs.map((config) => config.extension));
  for (const config of configs) {
    if (!isExtensionConfig<T>(config)) {
      continue;
    }
    const { extension, beforeExtensions, afterExtensions } = config;
    if (!graph.has(extension)) {
      graph.set(extension, []);
    }
    beforeExtensions?.forEach((beforeExtension) => {
      if (beforeExtension && origin.has(beforeExtension)) {
        if (!graph.has(beforeExtension)) {
          graph.set(beforeExtension, []);
        }
        graph.get(beforeExtension)!.push(extension); // Adding a dependency.
      }
    });
    afterExtensions?.forEach((afterExtension) => {
      if (afterExtension && origin.has(afterExtension)) {
        if (!graph.has(afterExtension)) {
          graph.set(afterExtension, []);
        }
        graph.get(extension)!.push(afterExtension); // Adding a dependency.
      }
    });
  }

  return { origin, graph };
}

export function findCycle<T>(configs: ExtensionConfig<T>[]): T[] | null {
  const { origin, graph } = getGraph(configs);
  const visited = new Set<T>();
  const stack = new Set<T>();
  const path: T[] = [];

  for (const extension of origin) {
    if (dfsWithPath(extension, graph, visited, stack, path)) {
      return path;
    }
  }
  return null;
}

function dfsWithPath<T>(extension: T, graph: Graph<T>, visited: Set<T>, stack: Set<T>, path: T[]): boolean {
  if (stack.has(extension)) {
    path.push(extension);
    return true; // Cycle found
  }

  if (visited.has(extension)) {
    return false; // There is no cycle here
  }

  visited.add(extension);
  stack.add(extension);

  for (const neighbor of graph.get(extension) || []) {
    if (dfsWithPath(neighbor, graph, visited, stack, path)) {
      path.push(extension);
      return true;
    }
  }

  stack.delete(extension);
  return false;
}
