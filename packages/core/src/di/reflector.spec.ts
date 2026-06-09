import { Reflector, isDelegateCtor } from './reflector.js';
import { DecoratorAndValue } from './top/decorator-and-value.js';
import { ClassMetaIterator } from './class-meta-iterator.js';
import { UnknownType } from '../di.js';

describe('Reflector', () => {
  describe('no error with simple call', () => {
    it('makeClassDecorator()', () => {
      expect(() => Reflector.makeClassDecorator()).not.toThrow();
    });
    it('classDecoratorFactory()', () => {
      expect(() => {
        const classDecoratorFactory = Reflector.makeClassDecorator();
        @classDecoratorFactory()
        class Service1 {}
      }).not.toThrow();
    });

    it('makePropDecorator()', () => {
      expect(() => Reflector.makePropDecorator()).not.toThrow();
    });
    it('propDecoratorFactory()', () => {
      expect(() => {
        const propDecoratorFactory = Reflector.makePropDecorator();
        class Service1 {
          @propDecoratorFactory()
          method1() {}
        }
      }).not.toThrow();
    });

    it('makeParamDecorator()', () => {
      expect(() => Reflector.makeParamDecorator()).not.toThrow();
    });
    it('paramDecoratorFactory()', () => {
      expect(() => {
        // eslint-disable-next-line no-useless-assignment
        const paramDecoratorFactory = Reflector.makeParamDecorator();
        class Service1 {
          method1(@paramDecoratorFactory() one: any) {}
        }
      }).not.toThrow();
    });
  });

  describe('collectMetadata()', () => {
    describe('classDecoratorFactory()', () => {
      const classDecoratorFactory = Reflector.makeClassDecorator((param1: any) => param1);

      it('no errors with transformer and simple call', () => {
        @classDecoratorFactory({ val: 1 })
        class Service1 {}
        expect(() => Reflector.collectMetadata(Service1)).not.toThrow();
      });

      it('returns ClassMetaIterator', () => {
        @classDecoratorFactory({ val: 1 })
        class Service1 {}

        const classMetaIterator = Reflector.collectMetadata(Service1);
        expect(classMetaIterator).toBeInstanceOf(ClassMetaIterator);
        expect(Array.from(classMetaIterator!).length).toBe(1);
        expect(classMetaIterator?.constructor.params).toEqual([]);
      });

      it('one or two arguments - different results', () => {
        @classDecoratorFactory({ val: 1 })
        class Service1 {}
        expect(Reflector.collectMetadata(Service1)).not.toBe(Reflector.collectMetadata(Service1, undefined));
        expect(Reflector.collectMetadata(Service1, 'constructor')).toBe(Reflector.collectMetadata(Service1, undefined));
      });

      it('store cache', () => {
        @classDecoratorFactory({ val: 1 })
        class Service1 {}
        class MockReflector extends Reflector {
          // Make this method public to properly testing it
          static override getOwnCacheMetadata(Cls: any) {
            return super.getOwnCacheMetadata(Cls) as any;
          }
        }
        expect(MockReflector.getOwnCacheMetadata(Service1)).toBeUndefined();
        Reflector.collectMetadata(Service1); // Make call to have the cache
        expect(MockReflector.getOwnCacheMetadata(Service1)).toBeInstanceOf(ClassMetaIterator);
      });

      it('child concat decorators with parent', () => {
        @classDecoratorFactory({ val: 'parent' })
        class Parent {}
        @classDecoratorFactory({ val: 'child' })
        class Child extends Parent {}

        expect(Reflector.collectMetadata(Parent, 'constructor')?.decorators).toEqual([
          new DecoratorAndValue(classDecoratorFactory, { val: 'parent' }, undefined, expect.any(String)),
        ]);
        const childMeta = Reflector.collectMetadata(Child, 'constructor');
        expect(childMeta?.decorators).toEqual([
          new DecoratorAndValue(classDecoratorFactory, { val: 'child' }, undefined, expect.any(String)),
          new DecoratorAndValue(classDecoratorFactory, { val: 'parent' }, undefined, expect.any(String)),
        ]);
      });
    });

    describe('propDecoratorFactory()', () => {
      const propDecoratorFactory = Reflector.makePropDecorator();

      it('no errors with simple call', () => {
        class Service1 {
          @propDecoratorFactory({ val: 2 })
          method1() {}

          method2() {}

          @propDecoratorFactory({ val: 3 })
          prop1() {}
        }
        expect(() => Reflector.collectMetadata(Service1)).not.toThrow();
      });

      it('returns ClassMetaIterator', () => {
        class Service1 {
          @propDecoratorFactory({ val: 2 })
          method1() {}

          method2() {}
        }
        const classMetaIterator = Reflector.collectMetadata(Service1);
        expect(classMetaIterator).toBeInstanceOf(ClassMetaIterator);
        expect(Array.from(classMetaIterator!).length).toBe(2);
      });

      it('has class properties', () => {
        class Service1 {
          @propDecoratorFactory({ val: 2 })
          method1() {}

          method2() {}

          @propDecoratorFactory({ val: 3 })
          prop1() {}
        }

        const classMetaIterator = Reflector.collectMetadata(Service1);
        expect(Array.from(classMetaIterator!)).toEqual(['method1', 'prop1', 'constructor']);
        expect(classMetaIterator?.constructor.decorators).toEqual([]);
        expect(classMetaIterator?.constructor.params).toEqual([]);
        expect(classMetaIterator?.method1.decorators).toEqual([
          new DecoratorAndValue(propDecoratorFactory, [{ val: 2 }]),
        ]);
        expect(classMetaIterator?.method1.params).toEqual([]);
        expect(classMetaIterator?.prop1.decorators).toEqual([
          new DecoratorAndValue(propDecoratorFactory, [{ val: 3 }]),
        ]);
        expect(classMetaIterator?.prop1.params).toEqual([]);
      });

      it('child concat decorators with parent', () => {
        class Parent {
          @propDecoratorFactory({ val: 'parent1' })
          method1() {}

          method2() {}

          @propDecoratorFactory({ val: 'parent2' })
          prop1() {}
        }
        class Child extends Parent {
          @propDecoratorFactory({ val: 'child1' })
          override method2() {}

          @propDecoratorFactory({ val: 'child2' })
          override prop1() {}
        }

        const childMeta = Reflector.collectMetadata(Child);
        // Only parent has this property with decorator
        expect(childMeta?.method1.decorators).toEqual([
          new DecoratorAndValue(propDecoratorFactory, [{ val: 'parent1' }]),
        ]);

        // Parent without decorator while child with decorator
        expect(childMeta?.method2.decorators).toEqual([
          new DecoratorAndValue(propDecoratorFactory, [{ val: 'child1' }]),
        ]);
        expect(childMeta?.method1.params).toEqual([]);

        // Both - parent and child has decorators
        expect(childMeta?.prop1.decorators).toEqual([
          new DecoratorAndValue(propDecoratorFactory, [{ val: 'child2' }]),
          new DecoratorAndValue(propDecoratorFactory, [{ val: 'parent2' }]),
        ]);
        expect(childMeta?.prop1.params).toEqual([]);
      });
    });

    describe('paramDecoratorFactory()', () => {
      const paramDecoratorFactory = Reflector.makeParamDecorator();

      it('no errors with simple call', () => {
        class Service1 {}
        class Service2 {}

        class Service3 {
          constructor(@paramDecoratorFactory() param1: Service1) {}
          method1(@paramDecoratorFactory() param1: Service2) {}
        }
        expect(() => Reflector.collectMetadata(Service3)).not.toThrow();
      });

      it('returns ClassMetaIterator', () => {
        class Service1 {}
        class Service2 {}

        class Service3 {
          constructor(@paramDecoratorFactory() param1: Service1) {}
          method1(@paramDecoratorFactory() param1: Service2) {}
        }
        const classMetaIterator = Reflector.collectMetadata(Service3);
        expect(classMetaIterator).toBeInstanceOf(ClassMetaIterator);
        expect(Array.from(classMetaIterator!).length).toBe(2);
      });

      it('has class properties', () => {
        class Service1 {}
        class Service2 {}

        class Service3 {
          constructor(
            param1: any,
            @paramDecoratorFactory({ val: 10 }) param2: string[],
            @paramDecoratorFactory({ val: 11 }) param3: Service1,
          ) {}

          method1(
            @paramDecoratorFactory({ val: 20 }) param1: Service2,
            param2: number,
            @paramDecoratorFactory({ val: 30 }) param3: string,
          ) {}
        }

        const classMetaIterator = Reflector.collectMetadata(Service3);
        expect(Array.from(classMetaIterator!)).toEqual(['method1', 'constructor']);
        expect(classMetaIterator?.constructor.params).toEqual([
          [],
          [Array, new DecoratorAndValue(paramDecoratorFactory, [{ val: 10 }])],
          [Service1, new DecoratorAndValue(paramDecoratorFactory, [{ val: 11 }])],
        ]);
        expect(classMetaIterator?.constructor.decorators).toEqual([]);
        expect(classMetaIterator?.method1.params).toEqual([
          [Service2, new DecoratorAndValue(paramDecoratorFactory, [{ val: 20 }])],
          [Number],
          [String, new DecoratorAndValue(paramDecoratorFactory, [{ val: 30 }])],
        ]);
        expect(classMetaIterator?.method1.decorators).toEqual([]);
      });

      it('child no concat decorators with parent', () => {
        class ParentParam1 {}
        class ParentParam2 {}
        class ParentParam3 {}
        class ParentParam4 {}
        class ChildPram1 {}
        class ChildPram2 {}
        class ChildPram3 {}

        class Parent {
          constructor(
            @paramDecoratorFactory('parent-param1') param1: ParentParam1,
            @paramDecoratorFactory('parent-param2') param2: ParentParam2,
          ) {}

          method1(@paramDecoratorFactory('parent-param1') param1: ParentParam2) {}

          method2(@paramDecoratorFactory('parent-param2') param1: ParentParam3) {}

          method3(@paramDecoratorFactory('parent-param3') param1: ParentParam4) {}
        }

        class Child extends Parent {
          constructor(param1: ChildPram1, param2: ChildPram2, @paramDecoratorFactory('child-param1') param3: ChildPram3) {
            super(param1, param2);
          }
          override method2(@paramDecoratorFactory('child-param1') param1?: ChildPram3) {}

          override method3() {}
        }

        const childMeta = Reflector.collectMetadata(Child);

        // Child override constructor params
        expect(childMeta?.constructor.decorators).toEqual([]);
        expect(childMeta?.constructor.params).toEqual([
          [ChildPram1],
          [ChildPram2],
          [ChildPram3, new DecoratorAndValue(paramDecoratorFactory, ['child-param1'])],
        ]);

        // Only parent has this property with decorator
        expect(childMeta?.method1.decorators).toEqual([]);
        expect(childMeta?.method1.params).toEqual([
          [ParentParam2, new DecoratorAndValue(paramDecoratorFactory, ['parent-param1'])],
        ]);

        // Parent and child has params with decorator
        expect(childMeta?.method2.decorators).toEqual([]);
        expect(childMeta?.method2.params).toEqual([
          [ChildPram3, new DecoratorAndValue(paramDecoratorFactory, ['child-param1'])],
        ]);

        // Parent has method with decorators,
        // while child override this method and not have decorators at all
        expect(childMeta?.method3.params).toEqual([]);
        expect(childMeta?.method3.decorators).toEqual([]);
      });
    });

    describe('mix: class and prop decorator factories', () => {
      const classDecoratorFactory = Reflector.makeClassDecorator();
      const propDecoratorFactory = Reflector.makePropDecorator();

      it('no errors with simple call', () => {
        @classDecoratorFactory({ val: 1 })
        class Service1 {
          @propDecoratorFactory({ val: 2 })
          method1() {}
          @propDecoratorFactory({ val: 3 })
          prop1() {}
        }
        expect(() => Reflector.collectMetadata(Service1)).not.toThrow();
      });

      it('returns ClassMetaIterator', () => {
        @classDecoratorFactory({ val: 1 })
        class Service1 {
          @propDecoratorFactory({ val: 2 })
          method1() {}
        }
        const classMetaIterator = Reflector.collectMetadata(Service1);
        expect(classMetaIterator).toBeInstanceOf(ClassMetaIterator);
        expect(Array.from(classMetaIterator!).length).toBe(2);
      });

      it('has class properties', () => {
        @classDecoratorFactory({ val: 1 })
        class Service1 {
          @propDecoratorFactory({ val: 2 })
          method1() {}
          @propDecoratorFactory({ val: 3 })
          prop1() {}
        }

        const classMetaIterator = Reflector.collectMetadata(Service1);
        expect(Array.from(classMetaIterator!)).toEqual(['method1', 'prop1', 'constructor']);
        expect(classMetaIterator?.constructor.decorators).toEqual([
          new DecoratorAndValue(classDecoratorFactory, [{ val: 1 }], undefined, expect.any(String)),
        ]);
        expect(classMetaIterator?.constructor.params).toEqual([]);
        expect(classMetaIterator?.method1.decorators).toEqual([
          new DecoratorAndValue(propDecoratorFactory, [{ val: 2 }]),
        ]);
        expect(classMetaIterator?.method1.params).toEqual([]);
        expect(classMetaIterator?.prop1.decorators).toEqual([
          new DecoratorAndValue(propDecoratorFactory, [{ val: 3 }]),
        ]);
        expect(classMetaIterator?.prop1.params).toEqual([]);
      });
    });

    describe('mix: class and param decorator factories', () => {
      const classDecoratorFactory = Reflector.makeClassDecorator();
      const paramDecoratorFactory = Reflector.makeParamDecorator();

      it('no errors with simple call', () => {
        class Service1 {}
        class Service2 {}

        @classDecoratorFactory({ val: 1 })
        class Service3 {
          constructor(@paramDecoratorFactory() param1: Service1) {}
          method1(@paramDecoratorFactory() param1: Service2) {}
        }
        expect(() => Reflector.collectMetadata(Service3)).not.toThrow();
      });

      it('returns ClassMetaIterator', () => {
        class Service1 {}
        class Service2 {}

        @classDecoratorFactory({ val: 1 })
        class Service3 {
          constructor(@paramDecoratorFactory() param1: Service1) {}
          method1(@paramDecoratorFactory() param1: Service2) {}
        }
        const classMetaIterator = Reflector.collectMetadata(Service3);
        expect(classMetaIterator).toBeInstanceOf(ClassMetaIterator);
        expect(Array.from(classMetaIterator!).length).toBe(2);
      });

      it('has class properties', () => {
        class Service1 {}
        class Service2 {}

        @classDecoratorFactory({ val: 3 })
        class Service3 {
          constructor(
            param1: any,
            @paramDecoratorFactory({ val: 10 }) param2: string[],
            @paramDecoratorFactory({ val: 11 }) param3: Service1,
          ) {}

          method1(
            @paramDecoratorFactory({ val: 20 }) param1: Service2,
            param2: number,
            @paramDecoratorFactory({ val: 30 }) param3: string,
          ) {}
        }

        const classMetaIterator = Reflector.collectMetadata(Service3);
        expect(Array.from(classMetaIterator!)).toEqual(['method1', 'constructor']);
        expect(classMetaIterator?.constructor.params).toEqual([
          [],
          [Array, new DecoratorAndValue(paramDecoratorFactory, [{ val: 10 }])],
          [Service1, new DecoratorAndValue(paramDecoratorFactory, [{ val: 11 }])],
        ]);
        expect(classMetaIterator?.method1.params).toEqual([
          [Service2, new DecoratorAndValue(paramDecoratorFactory, [{ val: 20 }])],
          [Number],
          [String, new DecoratorAndValue(paramDecoratorFactory, [{ val: 30 }])],
        ]);
        expect(classMetaIterator?.method1.decorators).toEqual([]);
      });
    });

    describe('mix: prop and param decorator factories', () => {
      const propDecoratorFactory = Reflector.makePropDecorator();
      const paramDecoratorFactory = Reflector.makeParamDecorator();

      it('no errors with simple call', () => {
        class Service2 {}

        class Service3 {
          @propDecoratorFactory({ val: 2 })
          method1(@paramDecoratorFactory() param1: Service2) {}

          method2(param1: Service2, param2: any) {}
        }
        expect(() => Reflector.collectMetadata(Service3)).not.toThrow();
      });

      it('returns ClassMetaIterator', () => {
        class Service2 {}

        class Service3 {
          @propDecoratorFactory({ val: 2 })
          method1(@paramDecoratorFactory() param1: Service2) {}
        }
        const classMetaIterator = Reflector.collectMetadata(Service3);
        expect(classMetaIterator).toBeInstanceOf(ClassMetaIterator);
        expect(Array.from(classMetaIterator!).length).toBe(2);
      });

      it('has class properties', () => {
        class Service2 {}

        class Service3 {
          @propDecoratorFactory({ val: 2 })
          method1(
            @paramDecoratorFactory({ val: 20 }) param1: Service2,
            param2: number,
            @paramDecoratorFactory({ val: 30 }) param3: string,
          ) {}

          method2(param1: Service2, param2: any) {}
        }

        const classMetaIterator = Reflector.collectMetadata(Service3);
        expect(Array.from(classMetaIterator!)).toEqual(['method1', 'constructor']);
        expect(classMetaIterator?.constructor.decorators).toEqual([]);
        expect(classMetaIterator?.constructor.params).toEqual([]);
        expect(classMetaIterator?.method1.params).toEqual([
          [Service2, new DecoratorAndValue(paramDecoratorFactory, [{ val: 20 }])],
          [Number],
          [String, new DecoratorAndValue(paramDecoratorFactory, [{ val: 30 }])],
        ]);
        expect(classMetaIterator?.method1.decorators).toEqual([
          new DecoratorAndValue(propDecoratorFactory, [{ val: 2 }]),
        ]);

        // Method without decorator
        const classMetaIterator2 = Reflector.collectMetadata(Service3, 'method2');
        expect(classMetaIterator2?.type).toBe(UnknownType);
        expect(classMetaIterator2?.decorators).toEqual([]);
        expect(classMetaIterator2?.params).toEqual([null, null]);

        // Non existing property
        const classMetaIterator3 = Reflector.collectMetadata(Service3, 'nonExistingPropName');
        expect(classMetaIterator3?.type).toBe(UnknownType);
        expect(classMetaIterator3?.decorators).toEqual([]);
        expect(classMetaIterator3?.params).toEqual([]);
      });
    });

    describe('mix: class, prop and param decorator factories', () => {
      const classDecoratorFactory = Reflector.makeClassDecorator();
      const propDecoratorFactory = Reflector.makePropDecorator();
      const paramDecoratorFactory = Reflector.makeParamDecorator();

      it('no errors with simple call', () => {
        class Service2 {}

        @classDecoratorFactory({ val: 111 })
        class Service3 {
          @propDecoratorFactory({ val: 2 })
          method1(@paramDecoratorFactory() param1: Service2) {}

          method2(param1: Service2, param2: any) {}
        }
        expect(() => Reflector.collectMetadata(Service3)).not.toThrow();
      });

      it('returns ClassMetaIterator', () => {
        class Service2 {}

        @classDecoratorFactory({ val: 111 })
        class Service3 {
          @propDecoratorFactory({ val: 2 })
          method1(@paramDecoratorFactory() param1: Service2) {}
        }
        const classMetaIterator = Reflector.collectMetadata(Service3);
        expect(classMetaIterator).toBeInstanceOf(ClassMetaIterator);
        expect(Array.from(classMetaIterator!).length).toBe(2);
      });

      it('has class properties', () => {
        class Service2 {}

        @classDecoratorFactory({ val: 111 })
        class Service3 {
          @propDecoratorFactory({ val: 2 })
          method1(
            @paramDecoratorFactory({ val: 20 }) param1: Service2,
            param2: number,
            @paramDecoratorFactory({ val: 30 }) param3: string,
          ) {}

          method2(param1: Service2, param2: any) {}
        }

        const classMetaIterator = Reflector.collectMetadata(Service3);
        expect(Array.from(classMetaIterator!)).toEqual(['method1', 'constructor']);
        expect(classMetaIterator?.constructor.decorators).toEqual([
          new DecoratorAndValue(classDecoratorFactory, [{ val: 111 }], undefined, expect.any(String)),
        ]);
        expect(classMetaIterator?.constructor.params).toEqual([]);
        expect(classMetaIterator?.method1.params).toEqual([
          [Service2, new DecoratorAndValue(paramDecoratorFactory, [{ val: 20 }])],
          [Number],
          [String, new DecoratorAndValue(paramDecoratorFactory, [{ val: 30 }])],
        ]);
        expect(classMetaIterator?.method1.decorators).toEqual([
          new DecoratorAndValue(propDecoratorFactory, [{ val: 2 }]),
        ]);

        // Method without decorator
        const classMetaIterator2 = Reflector.collectMetadata(Service3, 'method2');
        expect(classMetaIterator2?.type).toBe(UnknownType);
        expect(classMetaIterator2?.decorators).toEqual([]);
        expect(classMetaIterator2?.params).toEqual([null, null]);

        // Non existing property
        const classMetaIterator3 = Reflector.collectMetadata(Service3, 'nonExistingPropName');
        expect(classMetaIterator3?.type).toBe(UnknownType);
        expect(classMetaIterator3?.decorators).toEqual([]);
        expect(classMetaIterator3?.params).toEqual([]);
      });
    });

    describe('order of parent and child decorators on class and property level', () => {
      const classDecoratorFactory = Reflector.makeClassDecorator((...args: string[]) => args);
      const propDecoratorFactory = Reflector.makePropDecorator((...args: string[]) => args);

      @classDecoratorFactory('constructor1.3')
      @classDecoratorFactory('constructor1.2')
      @classDecoratorFactory('constructor1.1')
      class Class1 {
        @propDecoratorFactory('property1.3')
        @propDecoratorFactory('property1.2')
        @propDecoratorFactory('property1.1')
        prop1: any;

        @propDecoratorFactory('property1.6')
        @propDecoratorFactory('property1.5')
        @propDecoratorFactory('property1.4')
        prop2: any;
      }

      @classDecoratorFactory('constructor2.3')
      @classDecoratorFactory('constructor2.2')
      @classDecoratorFactory('constructor2.1')
      class Class2 extends Class1 {
        @propDecoratorFactory('property2.3')
        @propDecoratorFactory('property2.2')
        @propDecoratorFactory('property2.1')
        declare prop1: any;

        @propDecoratorFactory('property2.6')
        @propDecoratorFactory('property2.5')
        @propDecoratorFactory('property2.4')
        declare prop2: any;
      }

      @classDecoratorFactory('constructor3.3')
      @classDecoratorFactory('constructor3.2')
      @classDecoratorFactory('constructor3.1')
      class Class3 extends Class2 {
        @propDecoratorFactory('property3.3')
        @propDecoratorFactory('property3.2')
        @propDecoratorFactory('property3.1')
        declare prop1: any;

        @propDecoratorFactory('property3.6')
        @propDecoratorFactory('property3.5')
        @propDecoratorFactory('property3.4')
        declare prop2: any;
      }

      const moduleMeta = Reflector.collectMetadata(Class3);
      it('firs - child, next - parent', () => {
        expect(moduleMeta?.constructor.decorators.map((d) => d.value)).toEqual([
          ['constructor3.1'],
          ['constructor3.2'],
          ['constructor3.3'],
          ['constructor2.1'],
          ['constructor2.2'],
          ['constructor2.3'],
          ['constructor1.1'],
          ['constructor1.2'],
          ['constructor1.3'],
        ]);
        expect(moduleMeta?.prop1.decorators.map((d) => d.value)).toEqual([
          ['property3.1'],
          ['property3.2'],
          ['property3.3'],
          ['property2.1'],
          ['property2.2'],
          ['property2.3'],
          ['property1.1'],
          ['property1.2'],
          ['property1.3'],
        ]);
        expect(moduleMeta?.prop2.decorators.map((d) => d.value)).toEqual([
          ['property3.4'],
          ['property3.5'],
          ['property3.6'],
          ['property2.4'],
          ['property2.5'],
          ['property2.6'],
          ['property1.4'],
          ['property1.5'],
          ['property1.6'],
        ]);
      });
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
});
