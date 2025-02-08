import { ClassMetaIterator, init } from './class-meta-iterator.js';
import { jest } from '@jest/globals';

describe('ClassMetaIterator', () => {
  it('works with nested loops', () => {
    const for1 = jest.fn();
    const for2 = jest.fn();
    const sym = Symbol();
    const classMetaIterator = new ClassMetaIterator();
    (classMetaIterator as any)['key1'] = '';
    (classMetaIterator as any)[sym] = '';
    (classMetaIterator as any)['key2'] = '';
    classMetaIterator[init]();

    for (const v of classMetaIterator) {
      for1(v);

      for (const v of classMetaIterator) {
        for2(v);
      }
    }
    expect(for1).toHaveBeenCalledTimes(3);
    expect(for1).toHaveBeenNthCalledWith(1, 'key1');
    expect(for1).toHaveBeenNthCalledWith(2, 'key2');
    expect(for1).toHaveBeenNthCalledWith(3, sym);

    expect(for2).toHaveBeenCalledTimes(9);
    expect(for2).toHaveBeenNthCalledWith(1, 'key1');
    expect(for2).toHaveBeenNthCalledWith(2, 'key2');
    expect(for2).toHaveBeenNthCalledWith(3, sym);
    expect(for2).toHaveBeenNthCalledWith(4, 'key1');
    expect(for2).toHaveBeenNthCalledWith(5, 'key2');
    expect(for2).toHaveBeenNthCalledWith(6, sym);
    expect(for2).toHaveBeenNthCalledWith(7, 'key1');
    expect(for2).toHaveBeenNthCalledWith(8, 'key2');
    expect(for2).toHaveBeenNthCalledWith(9, sym);
  });
});
