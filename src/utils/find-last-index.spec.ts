import { findLastIndex } from './find-last-index';

describe('findLastIndex()', () => {
  it('case1', () => {
    const arr1: any[] = [];
    expect(findLastIndex(arr1, item => true)).toBeUndefined();
    expect(findLastIndex(arr1, item => false)).toBeUndefined();
  });

  it('case2', () => {
    const arr1: { id: number }[] = [{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }];
    expect(findLastIndex(arr1, item => true)).toBe(3);
  });

  it('case3', () => {
    const arr1: { id: number }[] = [{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }];
    expect(findLastIndex(arr1, obj => obj.id == 2)).toBe(1);
  });

  it('case3', () => {
    const arr1: { id: number; name?: string }[] = [
      { id: 1 },
      { id: 2, name: 'one' },
      { id: 2, name: 'two' },
      { id: 4 }
    ];
    expect(findLastIndex(arr1, obj => obj.id == 2)).toBe(2);
  });
});
