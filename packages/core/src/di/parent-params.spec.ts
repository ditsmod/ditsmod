import { jest } from '@jest/globals';

import { Reflector } from './reflector.js';
import { ParentParams, type ParentRecipe } from './parent-params.js';
import type { ParameterMeta } from './top/types-and-models.js';
import { Injector } from './injector.js';
import { inject } from './decorators.js';

const classDecoratorFactory = Reflector.makeClassDecorator();
const propDecoratorFactory = Reflector.makePropDecorator();
const paramDecoratorFactory = Reflector.makeParamDecorator();

class ClassBefore1Param1 {}
class ClassBefore1Param2 {}
class Class0Param1 {}
class Class0Param2 {}
class Class0Param3 {}
class Class1Param1 {}
class Class1Param2 {}
class Class2Param1 {}
class Class2Param2 {}
class Class3Param1 {}
class Class3Param2 {}

@classDecoratorFactory()
class ClassBefore1 {
  constructor(param1: ClassBefore1Param1, param2: ClassBefore1Param2) {}
}

@classDecoratorFactory()
class ClassBefore2 extends ClassBefore1 {
  constructor(parentParams: ParentParams) {
    // @ts-expect-error auto-injected
    super(...parentParams);
  }
}

@classDecoratorFactory()
class Class0 extends ClassBefore2 {
  constructor(param1: Class0Param1, param2: Class0Param2, param3: Class0Param3) {
    super([param1, param2]);
  }
}

@classDecoratorFactory()
class Class1 extends Class0 {
  constructor(param1: Class1Param1, param2: Class1Param2, parentParams: ParentParams) {
    // @ts-expect-error auto-injected
    super(...parentParams);
  }
}

@classDecoratorFactory()
class Class2 extends Class1 {
  constructor(
    param1: Class2Param1,
    @inject(ParentParams) parentParams: any[],
    param2: Class2Param2,
    parentParams2: ParentParams,
  ) {
    // @ts-expect-error auto-injected
    super(...parentParams);
  }

  @propDecoratorFactory()
  prop: string;
}

const class3Constructor = jest.fn();

@classDecoratorFactory()
class Class3 extends Class2 {
  constructor(parentParams: ParentParams, param1: Class3Param1, param2: Class3Param2) {
    // @ts-expect-error auto-injected
    super(...parentParams);
    class3Constructor(parentParams, param1, param2);
  }

  @propDecoratorFactory()
  declare prop: string;

  @propDecoratorFactory('prop3.1')
  method1(@inject('token2') param1: any) {
    return param1;
  }
}

describe('classMeta.constructor.params', () => {
  it('has info about all parents params', () => {
    const classMeta = Reflector.collectMetadata(Class3);
    const map = classMeta?.constructor.paramChain;
    expect(map).toBeInstanceOf(Map);
    expect(map?.size).toBe(6);
    expect(map?.has(Class3)).toBe(true);
    expect(map?.get(Class3)).toEqual<ParameterMeta[]>([[ParentParams], [Class3Param1], [Class3Param2]]);

    expect(map?.has(Class2)).toBe(true);
    expect(map?.get(Class2)).toEqual<ParameterMeta[]>([
      [Class2Param1],
      [Array, expect.any(Object)],
      [Class2Param2],
      [ParentParams],
    ]);

    expect(map?.has(Class1)).toBe(true);
    expect(map?.get(Class1)).toEqual<ParameterMeta[]>([[Class1Param1], [Class1Param2], [ParentParams]]);

    expect(map?.has(Class0)).toBe(true);
    expect(map?.get(Class0)).toEqual<ParameterMeta[]>([[Class0Param1], [Class0Param2], [Class0Param3]]);

    expect(map?.has(ClassBefore1)).toBe(true);
    expect(map?.get(ClassBefore1)).toEqual<ParameterMeta[]>([[ClassBefore1Param1], [ClassBefore1Param2]]);

    expect(map?.has(ClassBefore2)).toBe(true);
    expect(map?.get(ClassBefore2)).toEqual<ParameterMeta[]>([[ParentParams]]);
  });
});

describe('ParentParams', () => {
  describe('getParamsMetaAndRecipe()', () => {
    it('returns a one-dimensional array of params, without ParentParams', () => {
      const classMeta = Reflector.collectMetadata(Class3);
      const { aParamsMeta, recipe } = ParentParams.getParamsMetaAndRecipe([
        ...classMeta!.constructor.paramChain!.values(),
      ]);
      expect(aParamsMeta).toEqual<ParameterMeta[]>([
        [Class2Param1],
        [Class1Param1],
        [Class1Param2],
        [Class0Param1],
        [Class0Param2],
        [Class0Param3],
        [Class2Param2],
        [Class1Param1],
        [Class1Param2],
        [Class0Param1],
        [Class0Param2],
        [Class0Param3],
        [Class3Param1],
        [Class3Param2],
      ]);

      expect(recipe).toEqual<ParentRecipe[]>([[0, [1, 2, [3, 4, 5]], 6, [7, 8, [9, 10, 11]]], 12, 13]);

      const results = aParamsMeta.map((token) => (Array.isArray(token) ? token[0] : token));
      const class3Args = ParentParams.getArgs(recipe, results);
      expect(class3Args).toEqual([
        [
          Class2Param1,
          [Class1Param1, Class1Param2, [Class0Param1, Class0Param2, Class0Param3]],
          Class2Param2,
          [Class1Param1, Class1Param2, [Class0Param1, Class0Param2, Class0Param3]],
        ],
        Class3Param1,
        Class3Param2,
      ]);
    });
  });
});

describe('injector.get()', () => {
  afterEach(() => jest.resetAllMocks());

  const injector = Injector.resolveAndCreate([
    ClassBefore1Param1,
    ClassBefore1Param2,
    Class0Param1,
    Class0Param2,
    Class0Param3,
    Class1Param1,
    Class1Param2,
    Class2Param1,
    Class2Param2,
    Class3Param2,
    Class3,
    { token: 'token1', useFactory: [Class3, Class3.prototype.method1] },
    { token: 'token2', useValue: 'value2' },
    Class3Param1,
  ]);

  it('properly resolves classes with ParentParams', () => {
    expect(injector.get(Class3)).toBeInstanceOf(Class3);
    expect(class3Constructor).toHaveBeenCalledTimes(1);
    expect(class3Constructor).toHaveBeenCalledWith(
      [
        expect.any(Class2Param1),
        [
          expect.any(Class1Param1),
          expect.any(Class1Param2),
          [expect.any(Class0Param1), expect.any(Class0Param2), expect.any(Class0Param3)],
        ],
        expect.any(Class2Param2),
        [
          expect.any(Class1Param1),
          expect.any(Class1Param2),
          [expect.any(Class0Param1), expect.any(Class0Param2), expect.any(Class0Param3)],
        ],
      ],
      expect.any(Class3Param1),
      expect.any(Class3Param2),
    );
  });

  it('properly resolves class factory with ParentParams', () => {
    expect(injector.get('token1')).toBe('value2');
    expect(class3Constructor).toHaveBeenCalledTimes(1);
    expect(class3Constructor).toHaveBeenCalledWith(
      [
        expect.any(Class2Param1),
        [
          expect.any(Class1Param1),
          expect.any(Class1Param2),
          [expect.any(Class0Param1), expect.any(Class0Param2), expect.any(Class0Param3)],
        ],
        expect.any(Class2Param2),
        [
          expect.any(Class1Param1),
          expect.any(Class1Param2),
          [expect.any(Class0Param1), expect.any(Class0Param2), expect.any(Class0Param3)],
        ],
      ],
      expect.any(Class3Param1),
      expect.any(Class3Param2),
    );
  });
});
