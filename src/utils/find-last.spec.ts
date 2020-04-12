import { findLast } from './find-last';

describe('findLast()', () => {
  it('case1', () => {
    const arr1: any[] = [];
    expect(findLast(arr1, (item) => true)).toBeUndefined();
    expect(findLast(arr1, (item) => false)).toBeUndefined();
  });

  it('case2', () => {
    const arr1: { id: number }[] = [{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }];
    expect(findLast(arr1, (item) => true)).toEqual({ id: 4 });
  });

  it('case3', () => {
    const arr1: { id: number }[] = [{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }];
    expect(findLast(arr1, (obj) => obj.id == 2)).toEqual({ id: 2 });
  });

  it('case3', () => {
    const arr1: { id: number; name?: string }[] = [
      { id: 1 },
      { id: 2, name: 'one' },
      { id: 2, name: 'two' },
      { id: 4 },
    ];
    expect(findLast(arr1, (obj) => obj.id == 2)).toEqual({ id: 2, name: 'two' });
  });
});
