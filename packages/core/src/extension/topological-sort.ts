import { AnyObj } from '../types/mix.js';
import { getGraph, isGroupConfig } from './tarjan-graph.js';

export type GroupConfig<T> = {
  group: T;
  beforeGroup?: T;
};

type Graph<T> = Map<T, T[]>;

export function topologicalSort<T = any, R extends GroupConfig<T> = GroupConfig<any>>(
  configs: AnyObj[],
  groupsOnly: true,
): Set<T>;
export function topologicalSort<T = any, R extends GroupConfig<T> = GroupConfig<any>>(
  configs: AnyObj[],
  groupsOnly?: false,
): Set<R>;
export function topologicalSort<T = any, R extends GroupConfig<T> = GroupConfig<any>>(
  inputConfigs: AnyObj[],
  groupsOnly?: boolean,
): Set<R> | Set<T> {
  const configs = inputConfigs.filter(isGroupConfig) as R[];
  const { origin, graph } = getGraph<T>(configs);
  const visited = new Set<T>();
  const orderedGroupsSet = new Set<T>();

  // Running DFS for each group.
  for (const group of origin) {
    if (!visited.has(group)) {
      dfs(graph, visited, orderedGroupsSet, group);
    }
  }

  if (groupsOnly) {
    return orderedGroupsSet;
  }
  // Mapping the sorted result to GroupConfig<T>
  const orderedGroups = [...orderedGroupsSet].map((group) => configs.find((config) => config.group === group)!);
  return new Set(orderedGroups);
}

// Recursive depth-first search.
function dfs<T>(graph: Graph<T>, visited: Set<T>, orderedGroups: Set<T>, group: T) {
  if (visited.has(group)) {
    return;
  }
  visited.add(group);

  const neighbors = graph.get(group) || [];
  for (const neighbor of neighbors) {
    dfs(graph, visited, orderedGroups, neighbor);
  }

  orderedGroups.add(group); // Adding a group after processing all dependencies.
}
