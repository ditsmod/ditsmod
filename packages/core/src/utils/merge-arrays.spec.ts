import { mergeArrays } from './merge-arrays.js';

describe('mergeArrays()', () => {
  it('should merge with undefined', () => {
    const defaults = ['one', 'two'];
    const options: any = undefined;
    const result = mergeArrays(defaults, options);
    expect(result).toEqual(defaults);
  });

  it('should merge with another array', () => {
    const defaults = ['one', 'two'];
    const options = ['three'];
    const result = mergeArrays(defaults, options);
    expect(result).toEqual(['one', 'two', 'three']);
  });
});
