import { AnyObj } from '#types/mix.js';
import { getGraph, Graph, ExtensionConfig, isExtensionConfig } from './tarjan-graph.js';

export function topologicalSort<T = any, R extends ExtensionConfig<T> = ExtensionConfig<any>>(
  configs: AnyObj[],
  extensionsOnly: true,
): T[];
export function topologicalSort<T = any, R extends ExtensionConfig<T> = ExtensionConfig<any>>(
  configs: AnyObj[],
  extensionsOnly?: false,
): R[];
export function topologicalSort<T = any, R extends ExtensionConfig<T> = ExtensionConfig<any>>(
  inputConfigs: AnyObj[],
  extensionsOnly?: boolean,
): R[] | T[] {
  const configs = inputConfigs.filter(isExtensionConfig) as R[];
  const { origin, graph } = getGraph<T>(configs);
  const visited = new Set<T>();
  const orderedExtensions: T[] = [];

  // Running DFS for each extension.
  for (const extension of origin) {
    if (!visited.has(extension)) {
      dfs(graph, visited, orderedExtensions, extension);
    }
  }

  if (extensionsOnly) {
    return orderedExtensions;
  }
  // Mapping the sorted result to ExtensionConfig<T>
  return orderedExtensions.map((extension) => configs.findLast((config) => config.extension === extension)!);
}

// Recursive depth-first search.
function dfs<T>(graph: Graph<T>, visited: Set<T>, orderedExtensions: T[], extension: T) {
  if (visited.has(extension)) {
    return;
  }
  visited.add(extension);

  const neighbors = graph.get(extension) || [];
  for (const neighbor of neighbors) {
    dfs(graph, visited, orderedExtensions, neighbor);
  }

  orderedExtensions.push(extension); // Adding a extension after processing all dependencies.
}
