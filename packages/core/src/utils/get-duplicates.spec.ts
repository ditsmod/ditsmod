import { getDuplicates } from './get-duplicates.js';

describe('getDuplicates()', () => {
  it('should return 3', () => {
    const arr: any[] = [1, 3, 2, 3, 4, 3, 5, 8, 8, 1];
    expect(getDuplicates(arr)).toEqual([3, 8, 1]);
  });

  it('should return C3', () => {
    class C1 {}
    class C2 {}
    class C3 {}
    class C4 {}
    const arr: any[] = [C1, C3, C2, C3, C4, C3];
    expect(getDuplicates(arr)).toEqual([C3]);
  });

  it('should return empty array', () => {
    expect(getDuplicates(undefined as any)).toEqual([]);
  });
});
