import 'reflect-metadata/lite';
import { makeClassDecorator, makeParamDecorator, makePropDecorator } from './decorator-factories.js';
import { Reflector, isDelegateCtor } from './reflector.js';
import { ClassPropMeta, DecoratorAndValue, ParamsMeta, PropMetadataTuple, UnknownType } from './types-and-models.js';
import { CallsiteUtils } from '#utils/callsites.js';

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
  const __dir = CallsiteUtils.getCallerDir('anonymous');
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
  });

  describe('getMetadata', () => {
    const methodNameAsSymbol = Symbol();

    @classDecorator({ value: 'parent' })
    class Parent {
      @propDecorator('p1')
      @propDecorator('p2')
      a: AType;

      b: AType;

      @propDecorator('p1')
      [methodNameAsSymbol](param1: AType) {}

      @propDecorator('p11')
      methodWithDecorators(param1: AType) {}

      methodWithoutDecorators(param1: AType) {}

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

    describe('Parent', () => {
      it('should return array with null because of no decorators', () => {
        expect(reflector.getMetadata(Parent, 'methodWithoutDecorators')).toEqual({
          decorators: [],
          params: [null],
          type: UnknownType,
        });
      });
      it('should return empty array for non existen property name', () => {
        expect(reflector.getMetadata(Parent, 'nonExistingPropName' as any)).toEqual({
          decorators: [],
          params: [],
          type: UnknownType,
        });
      });
      it('should return array with one dependency', () => {
        const classPropMeta = {
          type: Function,
          decorators: [new DecoratorAndValue(propDecorator, 'p11')],
          params: [[AType]],
        } as ClassPropMeta;
        expect(reflector.getMetadata(Parent, 'methodWithDecorators')).toEqual(classPropMeta);
      });

      it('should return properties with decorators', () => {
        const p = reflector.getMetadata(Parent)!;
        const properties = [];
        for (const prop of p) {
          properties.push(prop);
        }
        expect(properties.length).toBe(9);
        expect(properties.includes('b')).toBe(false);
        expect(properties.includes('methodWithoutDecorators')).toBe(false);
        expect(properties.includes(methodNameAsSymbol)).toBe(true);
      });

      it('someMethod1', () => {
        const p = reflector.getMetadata(Parent)!;
        expect(p.someMethod1.type).toBe(Function);
        expect(p.someMethod1.decorators).toEqual<DecoratorAndValue[]>([new DecoratorAndValue(propDecorator, 'p4')]);
        expect(p.someMethod1.params).toEqual<PropMetadataTuple[]>([[AType]]);
      });

      it('someMethod2', () => {
        const p = reflector.getMetadata(Parent)!;
        expect(p.someMethod2.type).toBe(Function);
        expect(p.someMethod2.decorators).toEqual<DecoratorAndValue[]>([new DecoratorAndValue(propDecorator, 'p5')]);
        expect(p.someMethod2.params).toEqual<PropMetadataTuple[]>([
          [BType, new DecoratorAndValue(paramDecorator, 'method2 param1')],
          [DType],
        ]);
      });

      it('someMethod3', () => {
        const p = reflector.getMetadata(Parent)!;
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
      });

      it('c property should have CType', () => {
        const p = reflector.getMetadata(Parent)!;
        expect(p.c.type).toBe(CType);
      });

      it('constructor', () => {
        const p = reflector.getMetadata(Parent)!;
        expect(p.constructor.type).toBe(Function);
        expect(p.constructor.decorators).toMatchObject<DecoratorAndValue[]>([
          new DecoratorAndValue(classDecorator, { value: 'parent' }, __dir),
        ]);
        expect(p.constructor.params).toEqual<PropMetadataTuple[]>([
          [AType, new DecoratorAndValue(paramDecorator, 'a')],
          [BType, new DecoratorAndValue(paramDecorator, 'b')],
          [DType],
        ]);
      });
    });

    @classDecorator({ value: 'child' })
    class Child extends Parent {
      @propDecorator('child-p1')
      @propDecorator('child-p2')
      declare a: AType;

      declare b: AType;

      @propDecorator('child-p3')
      override set c(value: DType) {}

      @propDecorator('child-type')
      declare d: number;

      @propDecorator('child-p4')
      override someMethod1(a: BType) {}

      override someMethod3(
        @paramDecorator('child-method3 param1') c: CType,
        @paramDecorator('child-method3 param2 value1') @paramDecorator('child-method3 param2 value2') b: BType,
        d: DType,
      ) {}

      constructor(c: CType, @paramDecorator('b') b: BType, @paramDecorator('a') a: AType, d: DType) {
        super(a, b, d);
        this.a = a;
        this.b = b;
      }
    }

    it('Child', () => {
      const p2 = reflector.getMetadata(Child)!;
      expect(p2.someMethod1.type).toBe(Function);
      expect(p2.someMethod1.decorators).toEqual<DecoratorAndValue[]>([
        new DecoratorAndValue(propDecorator, 'child-p4'),
        new DecoratorAndValue(propDecorator, 'p4'),
      ]);
      expect(p2.someMethod1.params).toEqual<PropMetadataTuple[]>([[BType]]);

      expect(p2.someMethod2.type).toBe(Function);
      expect(p2.someMethod2.decorators).toEqual<DecoratorAndValue[]>([new DecoratorAndValue(propDecorator, 'p5')]);
      expect(p2.someMethod2.params).toEqual<PropMetadataTuple[]>([
        [BType, new DecoratorAndValue(paramDecorator, 'method2 param1')],
        [DType],
      ]);

      expect(p2.someMethod3.type).toBe(Function);
      expect(p2.someMethod3.decorators).toEqual<DecoratorAndValue[]>([]);
      expect(p2.someMethod3.params).toEqual<PropMetadataTuple[]>([
        [CType, new DecoratorAndValue(paramDecorator, 'child-method3 param1')],
        [
          BType,
          new DecoratorAndValue(paramDecorator, 'child-method3 param2 value2'),
          new DecoratorAndValue(paramDecorator, 'child-method3 param2 value1'),
        ],
        [DType],
      ]);

      expect(p2.c.type).toBe(DType);

      expect(p2.constructor.type).toBe(Function);
      expect(p2.constructor.decorators).toMatchObject<DecoratorAndValue[]>([
        new DecoratorAndValue(classDecorator, { value: 'child' }, __dir),
        new DecoratorAndValue(classDecorator, { value: 'parent' }, __dir),
      ]);
      expect(p2.constructor.params).toEqual<PropMetadataTuple[]>([
        [CType],
        [BType, new DecoratorAndValue(paramDecorator, 'b')],
        [AType, new DecoratorAndValue(paramDecorator, 'a')],
        [DType],
      ]);
    });
  });

  describe('parameters', () => {
    it('should return an array of parameters for a type', () => {
      const p = reflector.getMetadata(ClassWithDecorators, 'constructor')!;
      expect(p.params).toEqual<(ParamsMeta | [typeof DType])[]>([
        [AType, new DecoratorAndValue(paramDecorator, 'a')],
        [BType, new DecoratorAndValue(paramDecorator, 'b')],
        [DType],
      ]);
    });

    it('should return an array of parameters for someMethod2', () => {
      const p = reflector.getMetadata(ClassWithDecorators, 'someMethod2')!;
      expect(p.params).toEqual([[BType, new DecoratorAndValue(paramDecorator, 'method2 param')], [DType]]);
    });

    it('should return an array of parameters for someMethod3', () => {
      const p = reflector.getMetadata(ClassWithDecorators, 'someMethod3')!;
      expect(p.params).toEqual([
        [CType, new DecoratorAndValue(paramDecorator, 'method3 param1')],
        [
          BType,
          new DecoratorAndValue(paramDecorator, 'method3 param2 value2'),
          new DecoratorAndValue(paramDecorator, 'method3 param2 value1'),
        ],
        [AType],
      ]);
    });

    it('should work for a class without annotations', () => {
      const p = reflector.getMetadata(ClassWithoutDecorators, 'constructor')!;
      expect(p.params.length).toEqual(2);
    });
  });

  describe('propMetadata', () => {
    it('should return a string map of prop metadata for the given class', () => {
      const p = reflector.getMetadata(ClassWithDecorators)!;
      expect(p.a.type).toBe(AType);
      expect(p.a.decorators).toEqual<DecoratorAndValue[]>([
        new DecoratorAndValue(propDecorator, 'p2'),
        new DecoratorAndValue(propDecorator, 'p1'),
      ]);

      expect(p.c.type).toBe(CType);
      expect(p.c.decorators).toEqual<DecoratorAndValue[]>([new DecoratorAndValue(propDecorator, 'p3')]);

      expect(p.d.type).toBe(Number);
      expect(p.d.decorators).toEqual<DecoratorAndValue[]>([new DecoratorAndValue(propDecorator, 'type')]);

      expect(p.someMethod1.type).toBe(Function);
      expect(p.someMethod1.decorators).toEqual<DecoratorAndValue[]>([new DecoratorAndValue(propDecorator, 'p4')]);
    });

    it('should also return metadata if the class has no decorator', () => {
      class Test {
        @propDecorator('test')
        prop1: string;
      }

      const meta = reflector.getMetadata(Test)!;
      expect(meta.prop1.type).toBe(String);
      expect(meta.prop1.decorators).toEqual<DecoratorAndValue[]>([new DecoratorAndValue(propDecorator, 'test')]);
    });
  });

  describe('annotations', () => {
    it('should return an array of annotations for a type', () => {
      const declaredInDir = CallsiteUtils.getCallerDir('anonymous');
      const p = reflector.getMetadata(ClassWithDecorators)!.constructor.decorators;
      expect(p).toEqual([new DecoratorAndValue(classDecorator, { value: 'class' }, declaredInDir)]);
    });

    it('should work for a class without metadata in annotation', () => {
      const declaredInDir = CallsiteUtils.getCallerDir('anonymous');
      @classDecorator()
      class ClassWithoutMetadata {}
      const p = reflector.getMetadata(ClassWithoutMetadata)!.constructor.decorators;
      expect(p).toEqual([new DecoratorAndValue(classDecorator, undefined, declaredInDir)]);
    });

    it('should work class decorator without metadata transformator', () => {
      @classDecoratorWithoutTransformator()
      class ClassWithoutMetadata {}
      const p = reflector.getMetadata(ClassWithoutMetadata)!.constructor.decorators;
      const declaredInDir = CallsiteUtils.getCallerDir('anonymous');
      expect(p).toEqual([new DecoratorAndValue(classDecoratorWithoutTransformator, [], declaredInDir)]);
    });

    it('should work for a class without annotations', () => {
      const p = reflector.getMetadata(ClassWithoutDecorators)!.constructor.decorators;
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
      expect(() => reflector.getMetadata(dummyArrowFn as any)?.constructor.decorators).not.toThrow();
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
      const declaredInDir = CallsiteUtils.getCallerDir('anonymous');
      expect(reflector.getMetadata(Parent)!.constructor.decorators).toEqual([
        new DecoratorAndValue(classDecorator, { value: 'parent' }, declaredInDir),
      ]);

      expect(reflector.getMetadata(Child)!.constructor.decorators).toEqual([
        new DecoratorAndValue(classDecorator, { value: 'child' }, declaredInDir),
        new DecoratorAndValue(classDecorator, { value: 'parent' }, declaredInDir),
      ]);

      expect(reflector.getMetadata(ChildNoDecorators)!.constructor.decorators).toEqual([
        new DecoratorAndValue(classDecorator, { value: 'parent' }, declaredInDir),
      ]);

      expect(reflector.getMetadata(NoDecorators)).toBeUndefined();
      expect(reflector.getMetadata({} as any)).toBeUndefined();
      expect(reflector.getMetadata(1 as any)).toBeUndefined();
      expect(reflector.getMetadata(null!)).toBeUndefined();
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
      expect(reflector.getMetadata(Parent, 'constructor')?.params).toEqual<ParamsMeta[]>([
        [A, new DecoratorAndValue(paramDecorator, 'a')],
        [B, new DecoratorAndValue(paramDecorator, 'b')],
      ]);

      expect(reflector.getMetadata(Child, 'constructor')?.params).toEqual<ParamsMeta[]>([
        [A, new DecoratorAndValue(paramDecorator, 'a')],
        [B, new DecoratorAndValue(paramDecorator, 'b')],
      ]);

      expect(reflector.getMetadata(ChildWithDecorator, 'constructor')?.params).toEqual<ParamsMeta[]>([
        [A, new DecoratorAndValue(paramDecorator, 'a')],
        [B, new DecoratorAndValue(paramDecorator, 'b')],
      ]);

      expect(reflector.getMetadata(ChildWithDecoratorAndProps, 'constructor')?.params).toEqual<ParamsMeta[]>([
        [A, new DecoratorAndValue(paramDecorator, 'a')],
        [B, new DecoratorAndValue(paramDecorator, 'b')],
      ]);

      expect(reflector.getMetadata(ChildWithCtor, 'constructor')?.params).toEqual<ParamsMeta[]>([
        [C, new DecoratorAndValue(paramDecorator, 'c')],
      ]);

      // If we have no decorator, we don't get metadata about the ctor params.
      // But we should still get an array of the right length based on function.length.
      // TODO: Review use of `any` here (#19904)
      expect(reflector.getMetadata(ChildWithCtorNoDecorator, 'constructor')?.params).toEqual<ParamsMeta[]>([
        null,
        null,
        null,
      ] as any[]);

      expect(reflector.getMetadata(NoDecorators)).toBeUndefined();
      expect(reflector.getMetadata({} as any)).toBeUndefined();
      expect(reflector.getMetadata(1 as any)).toBeUndefined();
      expect(reflector.getMetadata(null!)).toBeUndefined();
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
      const parent = reflector.getMetadata(Parent)!;
      expect(parent.a.type).toBe(A);
      expect(parent.b.type).toBe(B);
      expect(parent.d.type).toBe(D);

      expect(parent.a.decorators).toEqual<DecoratorAndValue[]>([new DecoratorAndValue(propDecorator, 'a')]);
      expect(parent.b.decorators).toEqual<DecoratorAndValue[]>([new DecoratorAndValue(propDecorator, 'b1')]);
      expect(parent.d.decorators).toEqual<DecoratorAndValue[]>([new DecoratorAndValue(propDecorator, 'type parent')]);

      const child = reflector.getMetadata(Child)!;
      expect(child.a.type).toBe(A);
      expect(child.b.type).toBe(B);
      expect(child.d.type).toBe(D);
      expect(child.c.type).toBe(C);

      expect(child.a.decorators).toEqual<DecoratorAndValue[]>([new DecoratorAndValue(propDecorator, 'a')]);
      expect(child.b.decorators).toEqual<DecoratorAndValue[]>([
        new DecoratorAndValue(propDecorator, 'b2'),
        new DecoratorAndValue(propDecorator, 'b1'),
      ]);
      expect(child.d.decorators).toEqual<DecoratorAndValue[]>([
        new DecoratorAndValue(propDecorator, 'type child'),
        new DecoratorAndValue(propDecorator, 'type parent'),
      ]);
      expect(child.c.decorators).toEqual<DecoratorAndValue[]>([new DecoratorAndValue(propDecorator, 'c')]);

      expect(reflector.getMetadata(NoDecorators)).toBeUndefined();
      expect(reflector.getMetadata({} as any)).toBeUndefined();
      expect(reflector.getMetadata(1 as any)).toBeUndefined();
      expect(reflector.getMetadata(null!)).toBeUndefined();
    });
  });
});
