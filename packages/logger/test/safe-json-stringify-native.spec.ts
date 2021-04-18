import { safeJsonStringify } from '../src/safe-json-stringify';
import { getPathFile } from './util';

describe(getPathFile(__filename), () => {
  it('basic stringify', () => {
    expect('"foo"').toEqual(safeJsonStringify('foo'));
    expect('{"foo":"bar"}').toEqual(safeJsonStringify({ foo: 'bar' }));
  });

  it('object identity', () => {
    const a = { foo: 'bar' };
    const b = { one: a, two: a };
    expect('{"one":{"foo":"bar"},"two":{"foo":"bar"}}').toEqual(safeJsonStringify(b));
  });

  it('circular references', () => {
    const a = {} as any;
    a.a = a;
    a.b = 'c';

    expect(() => {
      safeJsonStringify(a);
    }).not.toThrow('should not exceed stack size');
    expect('{"a":"[Circular]","b":"c"}').toEqual(safeJsonStringify(a));
  });

  it('null', () => {
    expect('{"x":null}').toEqual(safeJsonStringify({ x: null }));
  });

  it('arrays', () => {
    const arr: any = [2];
    expect('[2]').toEqual(safeJsonStringify(arr));

    arr.push(arr);
    expect('[2,"[Circular]"]').toEqual(safeJsonStringify(arr));
    expect('{"x":[2,"[Circular]"]}').toEqual(safeJsonStringify({ x: arr }));
  });

  it('throwing toJSON', () => {
    const obj = {
      toJSON() {
        throw new Error('Failing');
      },
    };

    expect('"[Throws: Failing]"').toEqual(safeJsonStringify(obj));
    expect('{"x":"[Throws: Failing]"}').toEqual(safeJsonStringify({ x: obj }));
  });

  it('properties on Object.create(null)', () => {
    let obj = Object.create(null, {
      foo: {
        get() {
          return 'bar';
        },
        enumerable: true,
      },
    });
    expect('{"foo":"bar"}').toEqual(safeJsonStringify(obj));

    obj = Object.create(null, {
      foo: {
        get() {
          return 'bar';
        },
        enumerable: true,
      },
      broken: {
        get() {
          throw new Error('Broken');
        },
        enumerable: true,
      },
    });
    expect('{"foo":"bar","broken":"[Throws: Broken]"}').toEqual(safeJsonStringify(obj));
  });

  it('defined getter properties using __defineGetter__', () => {
    // non throwing
    let obj = {} as any;
    obj.__defineGetter__('foo', function () {
      return 'bar';
    });
    expect('{"foo":"bar"}').toEqual(safeJsonStringify(obj));

    // throwing
    obj = {};
    obj.__defineGetter__('foo', function () {
      return (undefined as any)['oh my'];
    });

    expect(() => {
      safeJsonStringify(obj);
    }).not.toThrow('should return throw if a getter throws an error');

    expect('{"foo":"[Throws: Cannot read property \'oh my\' of undefined]"}').toEqual(safeJsonStringify(obj));
  });

  it('enumerable defined getter properties using Object.defineProperty', () => {
    // non throwing
    let obj = {};
    Object.defineProperty(obj, 'foo', {
      get() {
        return 'bar';
      },
      enumerable: true,
    });
    expect('{"foo":"bar"}').toEqual(safeJsonStringify(obj));

    // throwing
    obj = {};
    Object.defineProperty(obj, 'foo', {
      get() {
        return (undefined as any)['oh my'];
      },
      enumerable: true,
    });

    expect(() => {
      safeJsonStringify(obj);
    }).not.toThrow('should return throw if a getter throws an error');

    expect('{"foo":"[Throws: Cannot read property \'oh my\' of undefined]"}').toEqual(safeJsonStringify(obj));
  });

  it('formatting', () => {
    const obj = { a: { b: 1, c: [{ d: 1 }] } }; // some nested object
    const formatters = [3, '\t', '	'];
    formatters.forEach((formatter) => {
      expect(JSON.stringify(obj, null, formatter)).toEqual(safeJsonStringify(obj, null, formatter));
    });
  });

  it('replacing', () => {
    const obj = { a: { b: 1, c: [{ d: 1 }] } }; // some nested object
    const replacers = [['a', 'c'], (k: any, v: any) => (typeof v == 'number' ? '***' : v), () => undefined as any, []];
    replacers.forEach((replacer: any) => {
      expect(JSON.stringify(obj, replacer)).toEqual(safeJsonStringify(obj, replacer));
    });
  });
});
