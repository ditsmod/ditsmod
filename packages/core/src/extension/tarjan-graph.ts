export type GroupConfig<T> = {
  group?: T;
  beforeGroup?: T;
};

type Graph<T> = Map<T, T[]>;

function buildGraph<T>(configs: GroupConfig<T>[]): Graph<T> {
  const graph = new Map() as Graph<T>;

  for (const { group, beforeGroup } of configs) {
    if (!group || !beforeGroup) {
      continue;
    }
    if (!graph.has(group)) {
      graph.set(group, []);
    }
    if (!graph.has(beforeGroup)) {
      graph.set(beforeGroup, []);
    }
    graph.get(group)?.push(beforeGroup); // We create the edge "group -> beforeGroup"
  }

  return graph;
}

export function findCycle<T>(configs: GroupConfig<T>[]): T[] | null {
  const graph = buildGraph(configs);
  const visited = new Set<T>();
  const stack = new Set<T>();
  const path: T[] = [];

  for (const [node] of graph) {
    if (dfsWithPath(node, graph, visited, stack, path)) {
      return path.reverse(); // Return the cycle path in correct order
    }
  }
  return null;
}

function dfsWithPath<T>(node: T, graph: Graph<T>, visited: Set<T>, stack: Set<T>, path: T[]): boolean {
  if (stack.has(node)) {
    path.push(node);
    return true; // Cycle found
  }

  if (visited.has(node)) {
    return false; // There is no cycle here
  }

  visited.add(node);
  stack.add(node);

  for (const neighbor of graph.get(node) || []) {
    if (dfsWithPath(neighbor, graph, visited, stack, path)) {
      path.push(node);
      return true;
    }
  }

  stack.delete(node);
  return false;
}
