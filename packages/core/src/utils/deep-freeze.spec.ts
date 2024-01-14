import { deepFreeze } from './deep-freeze.js';

describe('deepFreeze', () => {
  it('case 1', () => {
    const obj = { one: 1 };
    deepFreeze(obj);
    expect(() => (obj.one = 2)).toThrow(/Cannot assign to read only property/);
  });

  it('case 2', () => {
    const obj = { one: { internal: 1 } };
    deepFreeze(obj);
    expect(() => (obj.one.internal = 2)).toThrow(/Cannot assign to read only property/);
  });

  it('case 3', () => {
    const arr = [{ one: 1 }] as any;
    deepFreeze(arr);
    expect(() => arr.push({ two: 2 })).toThrow(/object is not extensible/);
  });

  it('case 4', () => {
    const arr = [{ one: 1 }];
    deepFreeze(arr);
    expect(() => (arr[0].one = 2)).toThrow(/Cannot assign to read only property/);
  });

  it('case 5', () => {
    const arr = [{ one: [{ internalOne: 1 }], two: { internalTwo: 2 } }];
    deepFreeze(arr);
    expect(() => (arr[0].one[0].internalOne = 3)).toThrow(/Cannot assign to read only property/);
    expect(() => (arr[0].two.internalTwo = 4)).toThrow(/Cannot assign to read only property/);
  });

  it('case 6', () => {
    class A {
      one = 1;
      two: number;
    }
    deepFreeze(A);
    const obj = new A();
    expect(() => (obj.one = 2)).not.toThrow();
    expect(() => (obj.two = 3)).not.toThrow();
    expect(obj.one).toBe(2);
    expect(obj.two).toBe(3);
  });

  it('case 7', () => {
    class A {
      static one = 1;
      static two: number;
    }
    deepFreeze(A);
    expect(() => (A.one = 2)).toThrow(/Cannot assign to read only property/);
    expect(() => (A.two = 3)).toThrow(/Cannot assign to read only property/);
    expect(A.one).toBe(1);
    expect(A.two).toBe(undefined);
  });
});
