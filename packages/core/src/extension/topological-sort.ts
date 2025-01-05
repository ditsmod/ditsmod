import { AnyObj } from '../types/mix.js';
import { buildGraph, isGroupConfig } from './tarjan-graph.js';

export type GroupConfig<T> = {
  group: T;
  beforeGroup?: T;
};

type Graph<T> = Map<T, T[]>;

export function topologicalSort<T = any, R extends GroupConfig<T> = GroupConfig<any>>(
  configs: AnyObj[],
  groupsOnly: true,
): T[];
export function topologicalSort<T = any, R extends GroupConfig<T> = GroupConfig<any>>(
  configs: AnyObj[],
  groupsOnly?: false,
): R[];
export function topologicalSort<T = any, R extends GroupConfig<T> = GroupConfig<any>>(
  inputConfigs: AnyObj[],
  groupsOnly?: boolean,
): R[] | T[] {
  const configs = inputConfigs.filter(isGroupConfig) as R[];
  const { origin, graph } = buildGraph<T>(configs);
  const visited = new Set<T>();
  const orderedGroups: T[] = [];

  // Running DFS for each group.
  for (const group of origin) {
    if (!visited.has(group)) {
      dfs(graph, visited, orderedGroups, group);
    }
  }

  if (groupsOnly) {
    return orderedGroups;
  }
  // Mapping the sorted result to GroupConfig<T>
  return orderedGroups.map((group) => configs.find((config) => config.group === group)!);
}

// Recursive depth-first search.
function dfs<T>(graph: Graph<T>, visited: Set<T>, orderedGroups: T[], group: T) {
  if (visited.has(group)) {
    return;
  }
  visited.add(group);

  const neighbors = graph.get(group) || [];
  for (const neighbor of neighbors) {
    dfs(graph, visited, orderedGroups, neighbor);
  }

  orderedGroups.push(group); // Adding a group after processing all dependencies.
}
