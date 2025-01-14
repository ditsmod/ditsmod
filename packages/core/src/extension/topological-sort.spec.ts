import { describe, expect, it } from 'vitest';
import { topologicalSort } from './topological-sort.js';
import { getGraph, ExtensionConfig} from './tarjan-graph.js';

describe('topologicalSort()', () => {
  it('case 1', () => {
    const configs: ExtensionConfig<string>[] = [
      { extension: 'EXT.1' },
      { extension: 'EXT.2', beforeExtensions: ['EXT.1'] },
      { extension: 'EXT.3', beforeExtensions: ['EXT.2'] },
    ];
    expect(topologicalSort(configs, true)).toEqual(['EXT.3', 'EXT.2', 'EXT.1']);
  });

  it('case 2', () => {
    const configs: ExtensionConfig<string>[] = [
      { extension: 'EXT.3', beforeExtensions: ['EXT.2'] },
      { extension: 'EXT.2', beforeExtensions: ['EXT.1'] },
      { extension: 'EXT.1' },
    ];
    expect(topologicalSort(configs, true)).toEqual(['EXT.3', 'EXT.2', 'EXT.1']);
  });

  it('case 3', () => {
    const configs: ExtensionConfig<string>[] = [
      { extension: 'EXT.2', beforeExtensions: ['EXT.1'] },
      { extension: 'EXT.3', beforeExtensions: ['EXT.2'] },
      { extension: 'EXT.1' },
    ];
    expect(topologicalSort(configs, true)).toEqual(['EXT.3', 'EXT.2', 'EXT.1']);
  });

  it('case 4', () => {
    const configs: ExtensionConfig<string>[] = [
      { extension: 'EXT.1' },
      { extension: 'EXT.2' },
      { extension: 'EXT.3', beforeExtensions: ['EXT.2'] },
    ];
    expect(topologicalSort(configs, true)).toEqual(['EXT.1', 'EXT.3', 'EXT.2']);
  });

  it('case 5', () => {
    const configs: ExtensionConfig<string>[] = [
      { extension: 'EXT.1' },
      { extension: 'EXT.2', beforeExtensions: ['EXT.1'] },
      { extension: 'EXT.3', beforeExtensions: ['EXT.10'] },
    ];
    expect(topologicalSort(configs, true)).toEqual(['EXT.2', 'EXT.1', 'EXT.3']);
  });

  it('case 6', () => {
    const configs: ExtensionConfig<string>[] = [
      { extension: 'EXT.1' },
      { extension: 'EXT.2', beforeExtensions: ['EXT.1'] },
      { extension: 'EXT.3', beforeExtensions: ['EXT.2'] },
      { extension: 'EXT.4', beforeExtensions: ['EXT.1'] },
      { extension: 'EXT.5', beforeExtensions: ['EXT.4'] },
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
    const configs: ExtensionConfig<string>[] = [
      { extension: 'EXT.5', beforeExtensions: ['EXT.4'] },
      { extension: 'EXT.1' },
      { extension: 'EXT.2', beforeExtensions: ['EXT.1'] },
      { extension: 'EXT.3', beforeExtensions: ['EXT.2'] },
      { extension: 'EXT.4', beforeExtensions: ['EXT.1'] },
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
    const configs: ExtensionConfig<string>[] = [
      { extension: 'EXT.1' },
      { extension: 'EXT.5', beforeExtensions: ['EXT.4'] },
      { extension: 'EXT.2', beforeExtensions: ['EXT.1'] },
      { extension: 'EXT.3', beforeExtensions: ['EXT.2'] },
      { extension: 'EXT.4', beforeExtensions: ['EXT.1'] },
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
