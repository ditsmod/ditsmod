import { mergeMaps } from './merge-maps';

describe('merge-maps', () => {
  it(`case 1`, () => {
    const map1 = new Map([[1, 2]]);
    const map2 = new Map([[3, 4]]);
    const result = mergeMaps(map1, map2);
    expect(result instanceof Map).toBe(true);
    expect(result.get(1)).toBe(2);
    expect(result.get(3)).toBe(4);
  });

  it(`case 2`, () => {
    const map1 = new Map([[1, 2]]);
    const map2 = new Map([[3, 4]]);
    const result = mergeMaps([map1, map2]);
    expect(result instanceof Map).toBe(true);
    expect(result.get(1)).toBe(2);
    expect(result.get(3)).toBe(4);
  });

  it(`case 3`, () => {
    expect(mergeMaps(null)).toEqual(new Map());
    expect(mergeMaps(undefined)).toEqual(new Map());
  });
});
