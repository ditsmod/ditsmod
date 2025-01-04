export type GroupConfig<T> = {
  group?: T;
  beforeGroup?: T;
};

export function topologicalSort(groups: any[]): any[] {
  const graph = new Map<any, any[]>();
  const visited: Set<any> = new Set();
  const result: any[] = [];

  // Construction of the graph of dependencies.
  const validGroups = new Set(groups.filter((g) => g?.group).map((g) => g.group));
  for (const item of groups) {
    if (!item || !item.group) {
      continue;
    }
    const { group, beforeGroup } = item;
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
  function dfs(node: any) {
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

  // Mapping the sorted result to GroupConfig<T> and adding non-GroupConfig<T> items
  const sortedGroups = result.map((group) => groups.find((g) => g.group === group)!);
  const nonGroupItems = groups.filter((g) => !g || !g.group);
  return [...sortedGroups, ...nonGroupItems];
}
