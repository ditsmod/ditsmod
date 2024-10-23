import 'reflect-metadata/lite';
import { makeClassDecorator, makeParamDecorator, makePropDecorator } from './decorator-factories.js';
import { Reflector, isDelegateCtor } from './reflector.js';
import { Class, DecoratorAndValue, ParamsMeta, PropMeta, PropMetadataTuple } from './types-and-models.js';
import { getCallerDir } from '#utils/callsites.js';

const classDecorator = makeClassDecorator((data?: any) => data);
const classDecoratorWithoutTransformator = makeClassDecorator();
const paramDecorator = makeParamDecorator((value: any) => value);
const propDecorator = makePropDecorator((value: string) => value);

class AType {
  constructor(public value: any) {}
}

class BType {
  constructor(public value: any) {}
}

class CType {
  constructor(public value: any) {}
}

class DType {
  constructor(public value: any) {}
}

@classDecorator({ value: 'class' })
class ClassWithDecorators {
  @propDecorator('p1')
  @propDecorator('p2')
  a: AType;

  b: AType;

  @propDecorator('p3')
  set c(value: CType) {}

  @propDecorator('type')
  d: number;

  @propDecorator('p4')
  someMethod1(a: AType) {}

  @propDecorator('p5')
  someMethod2(@paramDecorator('method2 param') b: BType, d: DType) {}

  someMethod3(
    @paramDecorator('method3 param1') c: CType,
    @paramDecorator('method3 param2 value1') @paramDecorator('method3 param2 value2') b: BType,
    a: AType,
  ) {}

  constructor(@paramDecorator('a') a: AType, @paramDecorator('b') b: BType, d: DType) {
    this.a = a;
    this.b = b;
  }
}

class ClassWithoutDecorators {
  constructor(a: any, b: any) {}
}

class TestObj {
  constructor(
    public a: any,
    public b: any,
  ) {}

  identity(arg: any) {
    return arg;
  }
}

describe('Reflector', () => {
  class MockReflector extends Reflector {
    override getPropMetadata<Proto extends object>(Cls: Class<Proto>): PropMeta<Proto> {
      return super.getPropMetadata(Cls);
    }
  }

  let reflector: MockReflector;

  beforeEach(() => {
    reflector = new MockReflector();
  });

  describe('parameters', () => {
    it('should return an array of parameters for a type', () => {
      const p = reflector.getParamsMetadata(ClassWithDecorators);
      expect(p).toEqual<(ParamsMeta | [typeof DType])[]>([
        [AType, new DecoratorAndValue(paramDecorator, 'a')],
        [BType, new DecoratorAndValue(paramDecorator, 'b')],
        [DType],
      ]);
    });

    it('should return an array of parameters for someMethod2', () => {
      const p = reflector.getParamsMetadata(ClassWithDecorators, 'someMethod2');
      expect(p).toEqual([[BType, new DecoratorAndValue(paramDecorator, 'method2 param')], [DType]]);
    });

    it('should return an array of parameters for someMethod3', () => {
      const p = reflector.getParamsMetadata(ClassWithDecorators, 'someMethod3');
      expect(p).toEqual([
        [CType, new DecoratorAndValue(paramDecorator, 'method3 param1')],
        [
          BType,
          new DecoratorAndValue(paramDecorator, 'method3 param2 value2'),
          new DecoratorAndValue(paramDecorator, 'method3 param2 value1'),
        ],
        [AType],
      ]);
    });

    it('should return an array of parameters for property "e"', () => {
      const p = reflector.getParamsMetadata(ClassWithDecorators, 'e' as any);
      expect(p).toEqual([]);
    });

    it('should work for a class without annotations', () => {
      const p = reflector.getParamsMetadata(ClassWithoutDecorators);
      expect(p.length).toEqual(2);
    });
  });

  describe('propMetadata', () => {
    it('should return a string map of prop metadata for the given class', () => {
      const p = reflector.getPropMetadata(ClassWithDecorators);
      expect(p.a).toEqual<PropMetadataTuple>([
        AType,
        new DecoratorAndValue(propDecorator, 'p1'),
        new DecoratorAndValue(propDecorator, 'p2'),
      ]);
      expect(p.c).toEqual<PropMetadataTuple>([CType, new DecoratorAndValue(propDecorator, 'p3')]);
      expect(p.d).toEqual<PropMetadataTuple>([Number, new DecoratorAndValue(propDecorator, 'type')]);
      expect(p.someMethod1).toEqual<PropMetadataTuple>([Function, new DecoratorAndValue(propDecorator, 'p4')]);
    });

    it('should also return metadata if the class has no decorator', () => {
      class Test {
        @propDecorator('test')
        prop1: string;
      }

      expect(reflector.getPropMetadata(Test)).toEqual<PropMeta>({
        prop1: [String, new DecoratorAndValue(propDecorator, 'test')],
      });
    });
  });

  describe('getMetadata', () => {
    @classDecorator({ value: 'parent' })
    class Parent {
      @propDecorator('p1')
      @propDecorator('p2')
      a: AType;

      b: AType;

      @propDecorator('p3')
      set c(value: CType) {}

      @propDecorator('type')
      d: number;

      @propDecorator('p4')
      someMethod1(a: AType) {}

      @propDecorator('p5')
      someMethod2(@paramDecorator('method2 param1') b: BType, d: DType) {}

      someMethod3(
        @paramDecorator('method3 param1') c: CType,
        @paramDecorator('method3 param2 value1') @paramDecorator('method3 param2 value2') b: BType,
        a: AType,
      ) {}

      constructor(@paramDecorator('a') a: AType, @paramDecorator('b') b: BType, d: DType) {
        this.a = a;
        this.b = b;
      }
    }

    @classDecorator({ value: 'child' })
    class Child extends Parent {
      @propDecorator('child-p1')
      @propDecorator('child-p2')
      declare a: AType;

      declare b: AType;

      @propDecorator('child-p3')
      override set c(value: CType) {}

      @propDecorator('child-type')
      declare d: number;

      @propDecorator('child-p4')
      override someMethod1(a: BType) {}

      @propDecorator('child-p5')
      override someMethod2(@paramDecorator('child-method2 param1') b: BType, c: CType) {}

      override someMethod3(
        @paramDecorator('child-method3 param1') c: CType,
        @paramDecorator('child-method3 param2 value1') @paramDecorator('child-method3 param2 value2') b: BType,
        d: DType,
      ) {}
    }

    it('Parent', () => {
      const p = reflector.getMetadata(Parent);
      expect(p.someMethod1.type).toBe(Function);
      expect(p.someMethod1.decorators).toEqual<DecoratorAndValue[]>([new DecoratorAndValue(propDecorator, 'p4')]);
      expect(p.someMethod1.params).toEqual<PropMetadataTuple[]>([[AType]]);

      expect(p.someMethod2.type).toBe(Function);
      expect(p.someMethod2.decorators).toEqual<DecoratorAndValue[]>([new DecoratorAndValue(propDecorator, 'p5')]);
      expect(p.someMethod2.params).toEqual<PropMetadataTuple[]>([
        [BType, new DecoratorAndValue(paramDecorator, 'method2 param1')],
        [DType],
      ]);

      expect(p.someMethod3.type).toBe(Function);
      expect(p.someMethod3.decorators).toEqual<DecoratorAndValue[]>([]);
      expect(p.someMethod3.params).toEqual<PropMetadataTuple[]>([
        [CType, new DecoratorAndValue(paramDecorator, 'method3 param1')],
        [
          BType,
          new DecoratorAndValue(paramDecorator, 'method3 param2 value2'),
          new DecoratorAndValue(paramDecorator, 'method3 param2 value1'),
        ],
        [AType],
      ]);

      expect(p.constructor.type).toBe(Function);
      const decoratorAndValue = new DecoratorAndValue(classDecorator, { value: 'parent' });
      delete decoratorAndValue.declaredInDir;
      expect(p.constructor.decorators).toMatchObject<DecoratorAndValue[]>([decoratorAndValue]);
      expect(p.constructor.params).toEqual<PropMetadataTuple[]>([
        [AType, new DecoratorAndValue(paramDecorator, 'a')],
        [BType, new DecoratorAndValue(paramDecorator, 'b')],
        [DType],
      ]);
    });

    it('Child', () => {
      const p = reflector.getMetadata(Child);
      expect(p.someMethod1.type).toBe(Function);
      expect(p.someMethod1.decorators).toEqual<DecoratorAndValue[]>([
        new DecoratorAndValue(propDecorator, 'child-p4'),
        new DecoratorAndValue(propDecorator, 'p4'),
      ]);
      expect(p.someMethod1.params).toEqual<PropMetadataTuple[]>([[BType]]);

      expect(p.someMethod2.type).toBe(Function);
      expect(p.someMethod2.decorators).toEqual<DecoratorAndValue[]>([
        new DecoratorAndValue(propDecorator, 'child-p5'),
        new DecoratorAndValue(propDecorator, 'p5'),
      ]);
      expect(p.someMethod2.params).toEqual<PropMetadataTuple[]>([
        [BType, new DecoratorAndValue(paramDecorator, 'child-method2 param1')],
        [CType],
      ]);

      expect(p.someMethod3.type).toBe(Function);
      expect(p.someMethod3.decorators).toEqual<DecoratorAndValue[]>([]);
      expect(p.someMethod3.params).toEqual<PropMetadataTuple[]>([
        [CType, new DecoratorAndValue(paramDecorator, 'child-method3 param1')],
        [
          BType,
          new DecoratorAndValue(paramDecorator, 'child-method3 param2 value2'),
          new DecoratorAndValue(paramDecorator, 'child-method3 param2 value1'),
        ],
        [DType],
      ]);

      expect(p.constructor.type).toBe(Function);
      const parentDecorator = new DecoratorAndValue(classDecorator, { value: 'parent' });
      delete parentDecorator.declaredInDir;
      const childDecorator = new DecoratorAndValue(classDecorator, { value: 'child' });
      delete childDecorator.declaredInDir;
      expect(p.constructor.decorators).toMatchObject<DecoratorAndValue[]>([childDecorator, parentDecorator]);
      expect(p.constructor.params).toEqual<PropMetadataTuple[]>([
        [AType, new DecoratorAndValue(paramDecorator, 'a')],
        [BType, new DecoratorAndValue(paramDecorator, 'b')],
        [DType],
      ]);
    });
  });

  describe('annotations', () => {
    it('should return an array of annotations for a type', () => {
      const declaredInDir = getCallerDir();
      const p = reflector.getClassMetadata(ClassWithDecorators);
      expect(p).toEqual([new DecoratorAndValue(classDecorator, { value: 'class' }, declaredInDir)]);
    });

    it('should work for a class without metadata in annotation', () => {
      const declaredInDir = getCallerDir();
      @classDecorator()
      class ClassWithoutMetadata {}
      const p = reflector.getClassMetadata(ClassWithoutMetadata);
      expect(p).toEqual([new DecoratorAndValue(classDecorator, undefined, declaredInDir)]);
    });

    it('should work class decorator without metadata transformator', () => {
      @classDecoratorWithoutTransformator()
      class ClassWithoutMetadata {}
      const p = reflector.getClassMetadata(ClassWithoutMetadata);
      const declaredInDir = getCallerDir();
      expect(p).toEqual([new DecoratorAndValue(classDecoratorWithoutTransformator, [], declaredInDir)]);
    });

    it('should work for a class without annotations', () => {
      const p = reflector.getClassMetadata(ClassWithoutDecorators);
      expect(p).toEqual([]);
    });
  });

  describe('isDelegateCtor', () => {
    it('should support ES5 compiled classes', () => {
      // These classes will be compiled to ES5 code so their stringified form
      // below will contain ES5 constructor functions rather than native classes.
      class Parent {}

      class ChildNoCtor extends Parent {}
      class ChildWithCtor extends Parent {
        constructor() {
          super();
        }
      }
      class ChildNoCtorPrivateProps extends Parent {
        private x = 10;
      }

      expect(isDelegateCtor(ChildNoCtor.toString())).toBe(true);
      expect(isDelegateCtor(ChildNoCtorPrivateProps.toString())).toBe(true);
      expect(isDelegateCtor(ChildWithCtor.toString())).toBe(false);
    });

    it('should not throw when no prototype on type', () => {
      // Cannot test arrow function here due to the compilation
      const dummyArrowFn = function () {};
      Object.defineProperty(dummyArrowFn, 'prototype', { value: undefined });
      expect(() => reflector.getClassMetadata(dummyArrowFn as any)).not.toThrow();
    });

    it('should support native class', () => {
      // These classes are defined as strings unlike the tests above because otherwise
      // the compiler (of these tests) will convert them to ES5 constructor function
      // style classes.
      const ChildNoCtor = 'class ChildNoCtor extends Parent {}\n';
      const ChildWithCtor = 'class ChildWithCtor extends Parent {\n  constructor() { super(); }}\n';
      const ChildNoCtorComplexBase = "class ChildNoCtor extends Parent['foo'].bar(baz) {}\n";
      const ChildWithCtorComplexBase =
        "class ChildWithCtor extends Parent['foo'].bar(baz) {\n  constructor() { super(); }}\n";
      const ChildNoCtorPrivateProps =
        'class ChildNoCtorPrivateProps extends Parent {\n' +
        '  constructor() {\n' +
        // Note that the instance property causes a pass-through constructor to be synthesized
        '    super(...arguments);\n' +
        '    this.x = 10;\n' +
        '  }\n' +
        '}\n';

      expect(isDelegateCtor(ChildNoCtor)).toBe(true);
      expect(isDelegateCtor(ChildNoCtorPrivateProps)).toBe(true);
      expect(isDelegateCtor(ChildWithCtor)).toBe(false);
      expect(isDelegateCtor(ChildNoCtorComplexBase)).toBe(true);
      expect(isDelegateCtor(ChildWithCtorComplexBase)).toBe(false);
    });

    it('should properly handle all class forms', () => {
      const ctor = (str: string) => expect(isDelegateCtor(str)).toBe(false);
      const noCtor = (str: string) => expect(isDelegateCtor(str)).toBe(true);

      ctor('class Bar extends Foo {constructor(){}}');
      ctor('class Bar extends Foo { constructor ( ) {} }');
      ctor('class Bar extends Foo { other(){}; constructor(){} }');

      noCtor('class extends Foo{}');
      noCtor('class extends Foo {}');
      noCtor('class Bar extends Foo {}');
      noCtor('class $Bar1_ extends $Fo0_ {}');
      noCtor('class Bar extends Foo { other(){} }');
    });
  });

  describe('inheritance with decorators', () => {
    it('should inherit annotations', () => {
      @classDecorator({ value: 'parent' })
      class Parent {}

      @classDecorator({ value: 'child' })
      class Child extends Parent {}

      class ChildNoDecorators extends Parent {}

      class NoDecorators {}

      // Check that metadata for Parent was not changed!
      const declaredInDir = getCallerDir();
      expect(reflector.getClassMetadata(Parent)).toEqual([
        new DecoratorAndValue(classDecorator, { value: 'parent' }, declaredInDir),
      ]);

      expect(reflector.getClassMetadata(Child)).toEqual([
        new DecoratorAndValue(classDecorator, { value: 'child' }, declaredInDir),
        new DecoratorAndValue(classDecorator, { value: 'parent' }, declaredInDir),
      ]);

      expect(reflector.getClassMetadata(ChildNoDecorators)).toEqual([
        new DecoratorAndValue(classDecorator, { value: 'parent' }, declaredInDir),
      ]);

      expect(reflector.getClassMetadata(NoDecorators)).toEqual([]);
      expect(reflector.getClassMetadata({} as any)).toEqual([]);
      expect(reflector.getClassMetadata(1 as any)).toEqual([]);
      expect(reflector.getClassMetadata(null!)).toEqual([]);
    });

    it('should inherit parameters', () => {
      class A {}
      class B {}
      class C {}

      // Note: We need the class decorator as well,
      // as otherwise TS won't capture the ctor arguments!
      @classDecorator({ value: 'parent' })
      class Parent {
        constructor(@paramDecorator('a') a: A, @paramDecorator('b') b: B) {}
      }

      class Child extends Parent {}

      @classDecorator({ value: 'child' })
      class ChildWithDecorator extends Parent {}

      @classDecorator({ value: 'child' })
      class ChildWithDecoratorAndProps extends Parent {
        private x = 10;
      }

      // Note: We need the class decorator as well,
      // as otherwise TS won't capture the ctor arguments!
      @classDecorator({ value: 'child' })
      class ChildWithCtor extends Parent {
        constructor(@paramDecorator('c') c: C) {
          super(null!, null!);
        }
      }

      class ChildWithCtorNoDecorator extends Parent {
        constructor(a: any, b: any, c: any) {
          super(null!, null!);
        }
      }

      class NoDecorators {}

      // Check that metadata for Parent was not changed!
      expect(reflector.getParamsMetadata(Parent)).toEqual<ParamsMeta[]>([
        [A, new DecoratorAndValue(paramDecorator, 'a')],
        [B, new DecoratorAndValue(paramDecorator, 'b')],
      ]);

      expect(reflector.getParamsMetadata(Child)).toEqual<ParamsMeta[]>([
        [A, new DecoratorAndValue(paramDecorator, 'a')],
        [B, new DecoratorAndValue(paramDecorator, 'b')],
      ]);

      expect(reflector.getParamsMetadata(ChildWithDecorator)).toEqual<ParamsMeta[]>([
        [A, new DecoratorAndValue(paramDecorator, 'a')],
        [B, new DecoratorAndValue(paramDecorator, 'b')],
      ]);

      expect(reflector.getParamsMetadata(ChildWithDecoratorAndProps)).toEqual<ParamsMeta[]>([
        [A, new DecoratorAndValue(paramDecorator, 'a')],
        [B, new DecoratorAndValue(paramDecorator, 'b')],
      ]);

      expect(reflector.getParamsMetadata(ChildWithCtor)).toEqual<ParamsMeta[]>([
        [C, new DecoratorAndValue(paramDecorator, 'c')],
      ]);

      // If we have no decorator, we don't get metadata about the ctor params.
      // But we should still get an array of the right length based on function.length.
      // TODO: Review use of `any` here (#19904)
      expect(reflector.getParamsMetadata(ChildWithCtorNoDecorator)).toEqual<ParamsMeta[]>([null, null, null] as any[]);

      expect(reflector.getParamsMetadata(NoDecorators)).toEqual<ParamsMeta[]>([]);
      expect(reflector.getParamsMetadata({} as any)).toEqual<ParamsMeta[]>([]);
      expect(reflector.getParamsMetadata(1 as any)).toEqual<ParamsMeta[]>([]);
      expect(reflector.getParamsMetadata(null!)).toEqual<ParamsMeta[]>([]);
    });

    it('should inherit property metadata', () => {
      class A {}
      class B {}
      class C {}
      class D {}

      class Parent {
        @propDecorator('a')
        a: A;
        @propDecorator('b1')
        b: B;
        @propDecorator('type parent')
        d: D;
      }

      class Child extends Parent {
        @propDecorator('b2')
        declare b: B;
        @propDecorator('c')
        c: C;
        @propDecorator('type child')
        declare d: D;
      }

      class NoDecorators {}

      // Check that metadata for Parent was not changed!
      expect(reflector.getPropMetadata(Parent)).toEqual<PropMeta>({
        a: [A, new DecoratorAndValue(propDecorator, 'a')],
        b: [B, new DecoratorAndValue(propDecorator, 'b1')],
        d: [D, new DecoratorAndValue(propDecorator, 'type parent')],
      });

      expect(reflector.getPropMetadata(Child)).toEqual<PropMeta>({
        a: [A, new DecoratorAndValue(propDecorator, 'a')],
        b: [B, new DecoratorAndValue(propDecorator, 'b1'), new DecoratorAndValue(propDecorator, 'b2')],
        d: [D, new DecoratorAndValue(propDecorator, 'type parent'), new DecoratorAndValue(propDecorator, 'type child')],
        c: [C, new DecoratorAndValue(propDecorator, 'c')],
      });

      expect(reflector.getPropMetadata(NoDecorators)).toEqual({});
      expect(reflector.getPropMetadata({} as any)).toEqual({});
      expect(reflector.getPropMetadata(1 as any)).toEqual({});
      expect(reflector.getPropMetadata(null!)).toEqual({});
    });
  });
});
