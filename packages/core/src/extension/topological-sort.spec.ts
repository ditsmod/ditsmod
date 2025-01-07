import { describe, expect, it } from 'vitest';
import { topologicalSort } from './topological-sort.js';
import { getGraph, GroupConfig} from './tarjan-graph.js';

describe('topologicalSort()', () => {
  it('case 1', () => {
    const configs: GroupConfig<string>[] = [
      { group: 'EXT.1' },
      { group: 'EXT.2', beforeGroups: ['EXT.1'] },
      { group: 'EXT.3', beforeGroups: ['EXT.2'] },
    ];
    expect(topologicalSort(configs, true)).toEqual(['EXT.3', 'EXT.2', 'EXT.1']);
  });

  it('case 2', () => {
    const configs: GroupConfig<string>[] = [
      { group: 'EXT.3', beforeGroups: ['EXT.2'] },
      { group: 'EXT.2', beforeGroups: ['EXT.1'] },
      { group: 'EXT.1' },
    ];
    expect(topologicalSort(configs, true)).toEqual(['EXT.3', 'EXT.2', 'EXT.1']);
  });

  it('case 3', () => {
    const configs: GroupConfig<string>[] = [
      { group: 'EXT.2', beforeGroups: ['EXT.1'] },
      { group: 'EXT.3', beforeGroups: ['EXT.2'] },
      { group: 'EXT.1' },
    ];
    expect(topologicalSort(configs, true)).toEqual(['EXT.3', 'EXT.2', 'EXT.1']);
  });

  it('case 4', () => {
    const configs: GroupConfig<string>[] = [
      { group: 'EXT.1' },
      { group: 'EXT.2' },
      { group: 'EXT.3', beforeGroups: ['EXT.2'] },
    ];
    expect(topologicalSort(configs, true)).toEqual(['EXT.1', 'EXT.3', 'EXT.2']);
  });

  it('case 5', () => {
    const configs: GroupConfig<string>[] = [
      { group: 'EXT.1' },
      { group: 'EXT.2', beforeGroups: ['EXT.1'] },
      { group: 'EXT.3', beforeGroups: ['EXT.10'] },
    ];
    expect(topologicalSort(configs, true)).toEqual(['EXT.2', 'EXT.1', 'EXT.3']);
  });

  it('case 6', () => {
    const configs: GroupConfig<string>[] = [
      { group: 'EXT.1' },
      { group: 'EXT.2', beforeGroups: ['EXT.1'] },
      { group: 'EXT.3', beforeGroups: ['EXT.2'] },
      { group: 'EXT.4', beforeGroups: ['EXT.1'] },
      { group: 'EXT.5', beforeGroups: ['EXT.4'] },
    ];
    expect(topologicalSort(configs, true)).toEqual([
      'EXT.3',
      'EXT.2',
      'EXT.5',
      'EXT.4',
      'EXT.1',
    ]);
  });

  it('case 7', () => {
    const configs: GroupConfig<string>[] = [
      { group: 'EXT.5', beforeGroups: ['EXT.4'] },
      { group: 'EXT.1' },
      { group: 'EXT.2', beforeGroups: ['EXT.1'] },
      { group: 'EXT.3', beforeGroups: ['EXT.2'] },
      { group: 'EXT.4', beforeGroups: ['EXT.1'] },
    ];
    expect(topologicalSort(configs, true)).toEqual([
      'EXT.5',
      'EXT.3',
      'EXT.2',
      'EXT.4',
      'EXT.1',
    ]);
  });

  it('case 8', () => {
    const configs: GroupConfig<string>[] = [
      { group: 'EXT.1' },
      { group: 'EXT.5', beforeGroups: ['EXT.4'] },
      { group: 'EXT.2', beforeGroups: ['EXT.1'] },
      { group: 'EXT.3', beforeGroups: ['EXT.2'] },
      { group: 'EXT.4', beforeGroups: ['EXT.1'] },
    ];
    expect(topologicalSort(configs, true)).toEqual([
      'EXT.3',
      'EXT.2',
      'EXT.5',
      'EXT.4',
      'EXT.1',
    ]);
  });
});
