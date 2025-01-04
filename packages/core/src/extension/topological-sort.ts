export type GroupConfig<T> = {
  group?: T;
  beforeGroup?: T;
};

export function topologicalSort<T>(groups: GroupConfig<T>[]): GroupConfig<T>[] {
  const graph = new Map<T, T[]>();
  const visited: Set<T> = new Set();
  const result: T[] = [];

  // Construction of the graph of dependencies.
  const validGroups = new Set(groups.map((g) => g.group));
  for (const { group, beforeGroup } of groups) {
    if (!group) {
      continue;
    }
    if (!graph.has(group)) {
      graph.set(group, []);
    }
    if (beforeGroup && validGroups.has(beforeGroup)) {
      if (!graph.has(beforeGroup)) {
        graph.set(beforeGroup, []);
      }
      graph.get(beforeGroup)!.push(group); // Adding a dependency.
    }
  }

  // Recursive depth-first search.
  function dfs(node: T) {
    if (visited.has(node)) return;
    visited.add(node);

    const neighbors = graph.get(node) || [];
    for (const neighbor of neighbors) {
      dfs(neighbor);
    }

    result.push(node); // Adding a node after processing all dependencies.
  }

  // Running DFS for each node.
  for (const node of validGroups) {
    if (!node) {
      continue;
    }
    if (!visited.has(node)) {
      dfs(node);
    }
  }

  // Mapping the sorted result to GroupConfig<T>
  return result.map((group) => groups.find((g) => g.group === group)!);
}
