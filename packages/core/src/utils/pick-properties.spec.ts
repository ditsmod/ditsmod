import { pickAllPropertiesAsGetters, pickPropertiesAsGetters } from './pick-properties.js';

describe('pickAllPropertiesAsGetters', () => {
  it('signature1: result = pickAllPropertiesAsGetters(targetObj, sourceObj)', () => {
    const targetObj: any = { one: null };
    const sourceObj = { one: 1, two: 2 };
    const result = pickAllPropertiesAsGetters(targetObj, sourceObj);
    expect(targetObj).toBe(result);
    expect(sourceObj).toEqual({ one: 1, two: 2 });
    expect(targetObj.one).toBe(1);
    sourceObj.one = 11;
    expect(targetObj.one).toBe(11);
    expect(targetObj).toBe(result);
  });

  it('signature2: targetObj = pickAllPropertiesAsGetters(sourceObj)', () => {
    const sourceObj: any = { one: null };
    const targetObj = pickAllPropertiesAsGetters(sourceObj);
    expect(sourceObj).not.toBe(targetObj);
    expect(sourceObj.one).toBe(null);
    expect(targetObj.one).toBe(null);
    sourceObj.one = 11;
    expect(targetObj.one).toBe(11);
  });

  it('signature3: result = pickAllPropertiesAsGetters(targetObj, sourceObj1, sourceObj2)', () => {
    const targetObj: any = { one: null, two: null, other: null };
    const sourceObj1 = { one: 1, two: 2, other: 'other value' };
    const sourceObj2 = { one: 11, two: 22 };
    const result = pickAllPropertiesAsGetters(targetObj, sourceObj1, sourceObj2);
    expect(targetObj).toBe(result);
    expect(sourceObj1).toEqual({ one: 1, two: 2, other: 'other value' });
    expect(sourceObj2).toEqual({ one: 11, two: 22 });
    expect(targetObj.one).toBe(11);
    expect(targetObj.two).toBe(22);
    expect(targetObj.other).toBe('other value');
    sourceObj1.one = 111;
    sourceObj1.two = 222;
    sourceObj1.other = 'some thing else';
    expect(targetObj.one).toBe(11);
    expect(targetObj.two).toBe(22);
    expect(targetObj.other).toBe('some thing else');
    sourceObj2.one = 1010;
    sourceObj2.two = 2020;
    expect(targetObj.one).toBe(1010);
    expect(targetObj.two).toBe(2020);
    expect(targetObj).toBe(result);
  });
});

describe('pickPropertiesAsGetters', () => {
  it('signature1: result = pickPropertiesAsGetters(targetObj, null, sourceObj)', () => {
    const targetObj: any = { one: null };
    const sourceObj = { one: 1, two: 2 };
    const result = pickPropertiesAsGetters(targetObj, {}, sourceObj);
    expect(targetObj).toBe(result);
    expect(sourceObj).toEqual({ one: 1, two: 2 });
    expect(targetObj.one).toBe(1);
    sourceObj.one = 11;
    expect(targetObj.one).toBe(11);
    expect(targetObj).toBe(result);
  });

  it('signature2: result = pickPropertiesAsGetters(targetObj, { includeProperties:... }, sourceObj)', () => {
    const targetObj: any = { one: null, two: null };
    const sourceObj = { one: 1, two: 2 };
    const result = pickPropertiesAsGetters(targetObj, { includeProperties: ['one'] }, sourceObj);
    expect(targetObj).toBe(result);
    expect(sourceObj).toEqual({ one: 1, two: 2 });
    expect(targetObj.one).toBe(1);
    expect(targetObj.two).toBe(null);
    sourceObj.one = 11;
    sourceObj.two = 22;
    expect(targetObj.one).toBe(11);
    expect(targetObj.two).toBe(null);
    expect(targetObj).toBe(result);
  });

  it('signature3: result = pickPropertiesAsGetters(targetObj, { excludeProperties:... }, sourceObj)', () => {
    const targetObj: any = { one: null, two: null };
    const sourceObj = { one: 1, two: 2 };
    const result = pickPropertiesAsGetters(targetObj, { excludeProperties: ['one'] }, sourceObj);
    expect(targetObj).toBe(result);
    expect(sourceObj).toEqual({ one: 1, two: 2 });
    expect(targetObj.one).toBe(null);
    expect(targetObj.two).toBe(2);
    sourceObj.one = 11;
    sourceObj.two = 22;
    expect(targetObj.one).toBe(null);
    expect(targetObj.two).toBe(22);
    expect(targetObj).toBe(result);
  });

  it('signature4: result = pickPropertiesAsGetters(targetObj, { excludeProperties:..., includeProperties:... }, sourceObj)', () => {
    const targetObj: any = { one: null, two: null };
    const sourceObj = { one: 1, two: 2 };
    const result = pickPropertiesAsGetters(
      targetObj,
      { excludeProperties: ['one'], includeProperties: ['one', 'two'] },
      sourceObj
    );
    expect(targetObj).toBe(result);
    expect(sourceObj).toEqual({ one: 1, two: 2 });
    expect(targetObj.one).toBe(null);
    expect(targetObj.two).toBe(2);
    sourceObj.one = 11;
    sourceObj.two = 22;
    expect(targetObj.one).toBe(null);
    expect(targetObj.two).toBe(22);
    expect(targetObj).toBe(result);
  });
});
