import { describe, expect, it } from 'vitest';
import { GroupConfig, topologicalSort } from './topological-sort.js';

describe('topologicalSort()', () => {
  it('case 1', () => {
    const groups1: GroupConfig<string>[] = [
      { group: 'MY_EXTENSIONS1' },
      { group: 'MY_EXTENSIONS2', beforeGroup: 'MY_EXTENSIONS1' },
      { group: 'MY_EXTENSIONS3', beforeGroup: 'MY_EXTENSIONS2' },
    ];
    expect(topologicalSort(groups1)).toEqual([
      { group: 'MY_EXTENSIONS3', beforeGroup: 'MY_EXTENSIONS2' },
      { group: 'MY_EXTENSIONS2', beforeGroup: 'MY_EXTENSIONS1' },
      { group: 'MY_EXTENSIONS1' },
    ]);
  });

  it('case 2', () => {
    const groups1: GroupConfig<string>[] = [
      { group: 'MY_EXTENSIONS3', beforeGroup: 'MY_EXTENSIONS2' },
      { group: 'MY_EXTENSIONS2', beforeGroup: 'MY_EXTENSIONS1' },
      { group: 'MY_EXTENSIONS1' },
    ];
    expect(topologicalSort(groups1)).toEqual([
      { group: 'MY_EXTENSIONS3', beforeGroup: 'MY_EXTENSIONS2' },
      { group: 'MY_EXTENSIONS2', beforeGroup: 'MY_EXTENSIONS1' },
      { group: 'MY_EXTENSIONS1' },
    ]);
  });

  it('case 3', () => {
    const groups1: GroupConfig<string>[] = [
      { group: 'MY_EXTENSIONS2', beforeGroup: 'MY_EXTENSIONS1' },
      { group: 'MY_EXTENSIONS3', beforeGroup: 'MY_EXTENSIONS2' },
      { group: 'MY_EXTENSIONS1' },
    ];
    expect(topologicalSort(groups1)).toEqual([
      { group: 'MY_EXTENSIONS3', beforeGroup: 'MY_EXTENSIONS2' },
      { group: 'MY_EXTENSIONS2', beforeGroup: 'MY_EXTENSIONS1' },
      { group: 'MY_EXTENSIONS1' },
    ]);
  });

  it('case 4', () => {
    const groups2: GroupConfig<string>[] = [
      { group: 'MY_EXTENSIONS1' },
      { group: 'MY_EXTENSIONS2' },
      { group: 'MY_EXTENSIONS3', beforeGroup: 'MY_EXTENSIONS2' },
    ];
    expect(topologicalSort(groups2)).toEqual([
      { group: 'MY_EXTENSIONS1' },
      { group: 'MY_EXTENSIONS3', beforeGroup: 'MY_EXTENSIONS2' },
      { group: 'MY_EXTENSIONS2' },
    ]);
  });

  it('case 5', () => {
    const groups3: GroupConfig<string>[] = [
      { group: 'MY_EXTENSIONS1' },
      { group: 'MY_EXTENSIONS2', beforeGroup: 'MY_EXTENSIONS1' },
      { group: 'MY_EXTENSIONS3', beforeGroup: 'MY_EXTENSIONS10' },
    ];
    expect(topologicalSort(groups3)).toEqual([
      { group: 'MY_EXTENSIONS2', beforeGroup: 'MY_EXTENSIONS1' },
      { group: 'MY_EXTENSIONS1' },
      { group: 'MY_EXTENSIONS3', beforeGroup: 'MY_EXTENSIONS10' },
    ]);
  });
});
