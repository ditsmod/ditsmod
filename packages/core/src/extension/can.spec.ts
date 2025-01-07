import { describe, expect, it } from 'vitest';
import { getGraph, Graph, GroupConfig } from './tarjan-graph.js';

describe('can()', () => {
  it('case 8', () => {
    const configs: GroupConfig<string>[] = [
      { group: 'EXT.1' },
      { group: 'EXT.2', beforeGroup: 'EXT.1' },
      { group: 'EXT.3', beforeGroup: 'EXT.2' },
      { group: 'EXT.4', beforeGroup: 'EXT.3' },
      { group: 'EXT.5', beforeGroup: 'EXT.1' },
    ];
    const expectedSet = [
      //
      'EXT.4',
      'EXT.3',
      'EXT.2',
      'EXT.5',
      'EXT.1',
    ];
    canJump<string>(expectedSet, getGraph<string>(configs).graph, 'EXT.4', 'EXT.1');
  });
});

function canJump<T>(stack: T[], graph: Graph<T>, from: T, to: T): boolean {
  if (!graph.has(to)) {
    return false;
  }
  const indexFrom = stack.indexOf(from);
  const indexTo = stack.indexOf(to);

  // const neighbors = graph.get(to)!;
  for (const group of stack.slice(indexFrom, indexTo)) {
    console.log('*'.repeat(50));
    console.log(group);
    console.log(graph.get(group));
  }
  return true;
}
