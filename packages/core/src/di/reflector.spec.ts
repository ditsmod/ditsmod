import { ClassMetaIterator } from './class-meta-iterator.js';
import { Reflector, isDelegateCtor } from './reflector.js';
import { DEPS_KEY } from './top/constants.js';
import { DecoratorAndValue } from './top/decorator-and-value.js';
import type { DepsMeta } from './top/resolved-provider.js';
import { Class, UnknownType } from './top/types-and-models.js';

describe('Reflector', () => {
  describe('class decorators', () => {
    it('stores default class decorator arguments on constructor metadata', () => {
      const classDecorator = Reflector.makeClassDecorator();

      @classDecorator({ val: 1 })
      class Service {}

      const metadata = Reflector.collectMetadata(Service);

      expect(metadata).toBeInstanceOf(ClassMetaIterator);
      expect(Array.from(metadata!)).toEqual(['constructor']);
      expect(metadata?.constructor.decorators).toEqual([
        new DecoratorAndValue(classDecorator, [{ val: 1 }], undefined, expect.any(String)),
      ]);
      expect(metadata?.constructor.params).toEqual([]);
    });

    it('stores transformed class decorator values and keeps the cached metadata instance', () => {
      const classDecorator = Reflector.makeClassDecorator((value: string) => ({ value }));

      @classDecorator('cached')
      class Service {}

      expect(Reflector.collectMetadata(Service)).toBe(Reflector.collectMetadata(Service));
      expect(Reflector.collectMetadata(Service, 'constructor')?.decorators).toEqual([
        new DecoratorAndValue(classDecorator, { value: 'cached' }, undefined, expect.any(String)),
      ]);
    });

    it('treats collectMetadata(cls, undefined) as a constructor metadata request', () => {
      const classDecorator = Reflector.makeClassDecorator();

      @classDecorator({ val: 1 })
      class Service {}

      expect(Reflector.collectMetadata(Service)).not.toBe(Reflector.collectMetadata(Service, undefined));
      expect(Reflector.collectMetadata(Service, 'constructor')).toBe(Reflector.collectMetadata(Service, undefined));
    });

    it('orders child class decorators before inherited decorators', () => {
      const classDecorator = Reflector.makeClassDecorator((value: string) => value);

      @classDecorator('parent')
      class Parent {}

      @classDecorator('child')
      class Child extends Parent {}

      expect(Reflector.collectMetadata(Child, 'constructor')?.decorators.map((item) => item.value)).toEqual([
        'child',
        'parent',
      ]);
    });

    it('stores transformed values and exposes them through class metadata', () => {
      function sharedDecoratorId() {}
      const controller = Reflector.makeClassDecorator(
        (path: string, method: 'GET' | 'POST') => ({ method, path }),
        'controller',
        sharedDecoratorId,
      );

      @controller('/users', 'GET')
      class UsersController {}

      const decorators = Reflector.getDecorators(UsersController);
      const constructorMeta = Reflector.collectMetadata(UsersController, 'constructor');

      expect(controller.name).toBe('controller');
      expect(decorators).toHaveLength(1);
      expect(decorators?.at(0)).toMatchObject({
        decorator: controller,
        decoratorId: sharedDecoratorId,
        value: { method: 'GET', path: '/users' },
      });
      expect(decorators?.[0].declaredInDir).toEqual(expect.any(String));
      expect(constructorMeta?.decorators).toBe(decorators);
    });

    it('returns undefined when no class decorators match the type guard', () => {
      const controller = Reflector.makeClassDecorator((path: string) => ({ kind: 'controller' as const, path }));
      const service = Reflector.makeClassDecorator((name: string) => ({ kind: 'service' as const, name }));

      @controller('/users')
      @service('users')
      class UsersController {}

      const controllers = Reflector.getDecorators(UsersController, (metadata): metadata is DecoratorAndValue => {
        return metadata.value.kind == 'controller';
      });
      const missing = Reflector.getDecorators(UsersController, (metadata): metadata is DecoratorAndValue => {
        return metadata.value.kind == 'missing';
      });

      expect(controllers?.map((metadata) => metadata.value)).toEqual([{ kind: 'controller', path: '/users' }]);
      expect(missing).toBeUndefined();
    });
  });

  describe('property decorators', () => {
    it('stores method and property decorators as iterable class metadata entries', () => {
      const propDecorator = Reflector.makePropDecorator();

      class Service {
        @propDecorator({ val: 2 })
        method() {}

        methodWithoutDecorator() {}

        @propDecorator({ val: 3 })
        prop!: string;
      }

      const metadata = Reflector.collectMetadata(Service);

      expect(metadata).toBeInstanceOf(ClassMetaIterator);
      expect(Array.from(metadata!)).toEqual(['method', 'prop', 'constructor']);
      expect(metadata?.method).toMatchObject({
        decorators: [new DecoratorAndValue(propDecorator, [{ val: 2 }])],
        params: [],
      });
      expect(metadata?.prop).toMatchObject({
        decorators: [new DecoratorAndValue(propDecorator, [{ val: 3 }])],
        params: [],
      });
      expect(metadata?.constructor.decorators).toEqual([]);
    });

    it('merges inherited property decorators while preserving child-first order', () => {
      const propDecorator = Reflector.makePropDecorator();

      class Parent {
        @propDecorator({ val: 'parent-only' })
        method1() {}

        method2() {}

        @propDecorator({ val: 'parent' })
        prop!: string;
      }

      class Child extends Parent {
        @propDecorator({ val: 'child-only' })
        override method2() {}

        @propDecorator({ val: 'child' })
        declare prop: string;
      }

      const metadata = Reflector.collectMetadata(Child);

      expect(metadata?.method1.decorators).toEqual([new DecoratorAndValue(propDecorator, [{ val: 'parent-only' }])]);
      expect(metadata?.method2.decorators).toEqual([new DecoratorAndValue(propDecorator, [{ val: 'child-only' }])]);
      expect(metadata?.prop.decorators).toEqual([
        new DecoratorAndValue(propDecorator, [{ val: 'child' }]),
        new DecoratorAndValue(propDecorator, [{ val: 'parent' }]),
      ]);
    });

    it('stores property metadata by string and symbol keys', () => {
      const symbolKey = Symbol('handler');
      const route = Reflector.makePropDecorator((method: 'GET' | 'POST', path: string) => ({ method, path }));

      class UsersController {
        @route('GET', '/users')
        list() {}

        @route('POST', '/users')
        [symbolKey]() {}
      }

      const metadata = Reflector.collectMetadata(UsersController)!;

      // Property decorators are reflected as iterable class metadata entries.
      expect(Array.from(metadata)).toEqual(['list', 'constructor', symbolKey]);
      expect(metadata.list.decorators).toEqual([new DecoratorAndValue(route, { method: 'GET', path: '/users' })]);
      expect(metadata[symbolKey].decorators).toEqual([
        new DecoratorAndValue(route, { method: 'POST', path: '/users' }),
      ]);
      // expect(Reflector.getRawPropMeta(UsersController, symbolKey)).toEqual(
      //   new DecoratorAndValue(route, { method: 'POST', path: '/users' }),
      // );
    });

    it('uses decorator application order on the same property', () => {
      const tag = Reflector.makePropDecorator((value: string) => value);

      class TaggedController {
        @tag('outer')
        @tag('inner')
        handle() {}
      }

      const metadata = Reflector.collectMetadata(TaggedController)!;

      expect(metadata.handle.decorators.map((item) => item.value)).toEqual(['inner', 'outer']);
    });
  });

  describe('parameter decorators', () => {
    it('merges constructor and method parameter decorators with reflected parameter types', () => {
      const paramDecorator = Reflector.makeParamDecorator();

      class Service1 {}
      class Service2 {}

      class Controller {
        constructor(
          param1: any,
          @paramDecorator({ val: 10 }) param2: string[],
          @paramDecorator({ val: 11 }) param3: Service1,
        ) {}

        method(
          @paramDecorator({ val: 20 }) param1: Service2,
          param2: number,
          @paramDecorator({ val: 30 }) param3: string,
        ) {}
      }

      const metadata = Reflector.collectMetadata(Controller);

      expect(Array.from(metadata!)).toEqual(['method', 'constructor']);
      expect(metadata?.constructor.params).toEqual([
        [],
        [Array, new DecoratorAndValue(paramDecorator, [{ val: 10 }])],
        [Service1, new DecoratorAndValue(paramDecorator, [{ val: 11 }])],
      ]);
      expect(metadata?.method.params).toEqual([
        [Service2, new DecoratorAndValue(paramDecorator, [{ val: 20 }])],
        [Number],
        [String, new DecoratorAndValue(paramDecorator, [{ val: 30 }])],
      ]);
      expect(metadata?.method.decorators).toEqual([]);
    });

    it('uses child parameter metadata for overridden constructors and methods', () => {
      const paramDecorator = Reflector.makeParamDecorator();

      class ParentParam1 {}
      class ParentParam2 {}
      class ParentParam3 {}
      class ParentParam4 {}
      class ChildParam1 {}
      class ChildParam2 {}
      class ChildParam3 {}

      class Parent {
        constructor(
          @paramDecorator('parent-param1') param1: ParentParam1,
          @paramDecorator('parent-param2') param2: ParentParam2,
        ) {}

        method1(@paramDecorator('parent-param1') param1: ParentParam2) {}

        method2(@paramDecorator('parent-param2') param1: ParentParam3) {}

        method3(@paramDecorator('parent-param3') param1: ParentParam4) {}
      }

      class Child extends Parent {
        constructor(param1: ChildParam1, param2: ChildParam2, @paramDecorator('child-param1') param3: ChildParam3) {
          super(param1, param2);
        }

        override method2(@paramDecorator('child-param1') param1?: ChildParam3) {}

        override method3() {}
      }

      const metadata = Reflector.collectMetadata(Child);

      expect(metadata?.constructor.params).toEqual([
        [ChildParam1],
        [ChildParam2],
        [ChildParam3, new DecoratorAndValue(paramDecorator, ['child-param1'])],
      ]);
      expect(metadata?.method1.params).toEqual([
        [ParentParam2, new DecoratorAndValue(paramDecorator, ['parent-param1'])],
      ]);
      expect(metadata?.method2.params).toEqual([
        [ChildParam3, new DecoratorAndValue(paramDecorator, ['child-param1'])],
      ]);
      expect(metadata?.method3.params).toEqual([]);
    });

    it('merges reflected parameter types with constructor and method parameter decorators', () => {
      const param = Reflector.makeParamDecorator((token: string) => ({ token }));

      class UserService {}
      class AuditService {}

      class UsersController {
        constructor(@param('users') users: UserService, plain: string, @param('audit') audit: AuditService) {}

        handle(@param('id') id: number, body: object) {}
      }

      const metadata = Reflector.collectMetadata(UsersController)!;

      // Object design types are intentionally normalized to an empty tuple.
      expect(metadata.constructor.params).toEqual([
        [UserService, new DecoratorAndValue(param, { token: 'users' })],
        [String],
        [AuditService, new DecoratorAndValue(param, { token: 'audit' })],
      ]);
      expect(metadata.handle.params).toEqual([[Number, new DecoratorAndValue(param, { token: 'id' })], []]);
      expect(metadata.handle.newParams.get(UsersController)).toBe(metadata.handle.params);
    });

    it('pads undecorated parameter positions with null before merging metadata', () => {
      const param = Reflector.makeParamDecorator((value: string) => value);

      class UsersController {
        handle(first: string, second: number, @param('third') third: boolean) {}
      }

      const metadata = Reflector.collectMetadata(UsersController)!;

      expect(Reflector.getRawParamMeta(UsersController, 'handle')).toEqual([
        null,
        null,
        [new DecoratorAndValue(param, 'third')],
      ]);
      expect(metadata.handle.params).toEqual([[String], [Number], [Boolean, new DecoratorAndValue(param, 'third')]]);
    });

    it('creates fallback parameter metadata for methods without decorators', () => {
      class UsersController {
        handle(first: string, second: number) {}
      }

      const methodMeta = Reflector.collectMetadata(UsersController, 'handle');
      const missingMeta = Reflector.collectMetadata(UsersController, 'missing');

      expect(methodMeta).toMatchObject({
        type: UnknownType,
        decorators: [],
        params: [null, null],
      });
      expect(missingMeta).toMatchObject({
        type: UnknownType,
        decorators: [],
        params: [],
      });
      expect(methodMeta?.newParams.get(UsersController)).toBe(methodMeta?.params);
    });
  });

  describe('mixed metadata', () => {
    it('combines class, property, and parameter metadata on one class', () => {
      const classDecorator = Reflector.makeClassDecorator();
      const propDecorator = Reflector.makePropDecorator();
      const paramDecorator = Reflector.makeParamDecorator();

      class Service {}

      @classDecorator({ val: 111 })
      class Controller {
        @propDecorator({ val: 2 })
        method(
          @paramDecorator({ val: 20 }) param1: Service,
          param2: number,
          @paramDecorator({ val: 30 }) param3: string,
        ) {}

        methodWithoutDecorators(param1: Service, param2: any) {}
      }

      const metadata = Reflector.collectMetadata(Controller);

      expect(Array.from(metadata!)).toEqual(['method', 'constructor']);
      expect(metadata?.constructor.decorators).toEqual([
        new DecoratorAndValue(classDecorator, [{ val: 111 }], undefined, expect.any(String)),
      ]);
      expect(metadata?.method.decorators).toEqual([new DecoratorAndValue(propDecorator, [{ val: 2 }])]);
      expect(metadata?.method.params).toEqual([
        [Service, new DecoratorAndValue(paramDecorator, [{ val: 20 }])],
        [Number],
        [String, new DecoratorAndValue(paramDecorator, [{ val: 30 }])],
      ]);

      expect(Reflector.collectMetadata(Controller, 'methodWithoutDecorators')).toMatchObject({
        type: UnknownType,
        decorators: [],
        params: [null, null],
      });
      expect(Reflector.collectMetadata(Controller, 'nonExistingPropName')).toMatchObject({
        type: UnknownType,
        decorators: [],
        params: [],
      });
    });

    it('preserves decorator order across multiple inheritance levels', () => {
      const classDecorator = Reflector.makeClassDecorator((...args: string[]) => args);
      const propDecorator = Reflector.makePropDecorator((...args: string[]) => args);

      @classDecorator('constructor1.3')
      @classDecorator('constructor1.2')
      @classDecorator('constructor1.1')
      class Class1 {
        @propDecorator('property1.3')
        @propDecorator('property1.2')
        @propDecorator('property1.1')
        prop1!: string;

        @propDecorator('property1.6')
        @propDecorator('property1.5')
        @propDecorator('property1.4')
        prop2!: string;
      }

      @classDecorator('constructor2.3')
      @classDecorator('constructor2.2')
      @classDecorator('constructor2.1')
      class Class2 extends Class1 {
        @propDecorator('property2.3')
        @propDecorator('property2.2')
        @propDecorator('property2.1')
        declare prop1: string;

        @propDecorator('property2.6')
        @propDecorator('property2.5')
        @propDecorator('property2.4')
        declare prop2: string;
      }

      @classDecorator('constructor3.3')
      @classDecorator('constructor3.2')
      @classDecorator('constructor3.1')
      class Class3 extends Class2 {
        @propDecorator('property3.3')
        @propDecorator('property3.2')
        @propDecorator('property3.1')
        declare prop1: string;

        @propDecorator('property3.6')
        @propDecorator('property3.5')
        @propDecorator('property3.4')
        declare prop2: string;
      }

      const metadata = Reflector.collectMetadata(Class3);

      expect(metadata?.constructor.decorators.map((item) => item.value)).toEqual([
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
      expect(metadata?.prop1.decorators.map((item) => item.value)).toEqual([
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
      expect(metadata?.prop2.decorators.map((item) => item.value)).toEqual([
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

  describe('isDelegateCtor()', () => {
    it('detects ES5 compiled child classes that delegate construction to the parent', () => {
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

    it('detects native child classes that have no explicit constructor', () => {
      expect(isDelegateCtor('class ChildNoCtor extends Parent {}\n')).toBe(true);
      expect(isDelegateCtor("class ChildNoCtor extends Parent['foo'].bar(baz) {}\n")).toBe(true);
      expect(isDelegateCtor('class Child extends Parent { other(){} }')).toBe(true);
    });

    it('detects native generated delegate constructors with instance property initialization', () => {
      const childWithGeneratedCtor =
        'class ChildNoCtorPrivateProps extends Parent {\n' +
        '  constructor() {\n' +
        '    super(...arguments);\n' +
        '    this.x = 10;\n' +
        '  }\n' +
        '}\n';

      expect(isDelegateCtor(childWithGeneratedCtor)).toBe(true);
    });

    it('does not treat explicit constructors or non-inherited classes as delegate constructors', () => {
      const explicitConstructors = [
        'class ChildWithCtor extends Parent {\n  constructor() { super(); }}\n',
        "class ChildWithCtor extends Parent['foo'].bar(baz) {\n  constructor() { super(); }}\n",
        'class Bar extends Foo {constructor(){}}',
        'class Bar extends Foo { constructor ( ) {} }',
        'class Bar extends Foo { other(){}; constructor(){} }',
        'class Bar {}',
      ];

      explicitConstructors.forEach((classSource) => {
        expect(isDelegateCtor(classSource)).toBe(false);
      });
    });
  });

  describe('inheritance', () => {
    it('combines child metadata before parent metadata', () => {
      const classTag = Reflector.makeClassDecorator((value: string) => value);
      const propTag = Reflector.makePropDecorator((value: string) => value);

      @classTag('parent')
      class ParentController {
        @propTag('parent')
        handle() {}
      }

      @classTag('child')
      class ChildController extends ParentController {
        @propTag('child')
        override handle() {}
      }

      const metadata = Reflector.collectMetadata(ChildController)!;

      expect(metadata.constructor.decorators.map((item) => item.value)).toEqual(['child', 'parent']);
      expect(metadata.handle.decorators.map((item) => item.value)).toEqual(['child', 'parent']);
    });

    it('removes inherited params when a child overrides a method without parameter metadata', () => {
      const param = Reflector.makeParamDecorator((value: string) => value);

      class ParentParam {}

      class ParentController {
        handle(@param('parent') value: ParentParam) {}
      }

      class ChildController extends ParentController {
        override handle() {}
      }

      const metadata = Reflector.collectMetadata(ChildController)!;

      // The child method is own code, so parent parameter metadata must not leak into it.
      expect(metadata.handle.params).toEqual([]);
      expect(metadata.handle.decorators).toEqual([]);
    });

    it('keeps parent metadata isolated when child metadata is merged', () => {
      const prop = Reflector.makePropDecorator((value: string) => value);

      class ParentController {
        @prop('parent')
        handle() {}
      }

      class ChildController extends ParentController {}

      const parentMeta = Reflector.collectMetadata(ParentController)!;
      const parentDeps: DepsMeta = { deps: [] };
      Reflect.set(parentMeta.handle, DEPS_KEY, parentDeps);

      const childMeta = Reflector.collectMetadata(ChildController)!;
      const childDeps = Reflect.get(childMeta.handle, DEPS_KEY) as DepsMeta;
      childDeps.deps = childDeps.deps.slice();

      childMeta.handle.decorators.push(new DecoratorAndValue(prop, 'child-only'));

      expect(parentMeta.handle.decorators.map((item) => item.value)).toEqual(['parent']);
      expect(childDeps.deps).not.toBe(parentDeps.deps);
      expect(parentDeps.deps).toEqual([]);
    });

    it('uses parent constructor params for a child class that delegates construction', () => {
      const param = Reflector.makeParamDecorator((value: string) => value);

      class ParentParam {}

      class ParentController {
        constructor(@param('parent') value: ParentParam) {}
      }

      class ChildController extends ParentController {}

      const metadata = Reflector.collectMetadata(ChildController)!;

      expect(metadata.constructor.params).toEqual([[ParentParam, new DecoratorAndValue(param, 'parent')]]);
    });
  });

  describe('raw metadata helpers and cache', () => {
    it('applies raw class and parameter decorators through helper methods', () => {
      const classTag = Reflector.makeClassDecorator((value: string) => value);
      const paramTag = Reflector.makeParamDecorator((value: string) => value);

      class RawController {
        constructor(value: string) {}
      }

      Reflector.setRawClassMeta(RawController, classTag('raw-class'));
      Reflector.setRawParamMeta(RawController, undefined, 0, paramTag('raw-param'));

      expect(Reflector.getRawClassMeta(RawController)).toEqual([
        new DecoratorAndValue(classTag, 'raw-class', undefined, expect.any(String)),
      ]);
      expect(Reflector.getRawParamMeta(RawController)).toEqual([[new DecoratorAndValue(paramTag, 'raw-param')]]);
    });

    it('defines default raw metadata only once', () => {
      class RawController {}

      const firstDefault = ['first'];
      const secondDefault = ['second'];

      expect(Reflector.getRawMeta(RawController, 'custom-key', undefined, firstDefault)).toBe(firstDefault);
      expect(Reflector.getRawMeta(RawController, 'custom-key', undefined, secondDefault)).toBe(firstDefault);
    });

    it('returns cached class metadata on repeated collection', () => {
      const classTag = Reflector.makeClassDecorator();

      @classTag('cached')
      class CachedController {}

      const first = Reflector.collectMetadata(CachedController);
      const second = Reflector.collectMetadata(CachedController);

      expect(first).toBeInstanceOf(ClassMetaIterator);
      expect(second).toBe(first);
    });

    it('returns undefined for values that are not classes', () => {
      expect(Reflector.collectMetadata({} as any)).toBeUndefined();
    });

    it('creates constructor metadata with Class type when only parameter metadata exists', () => {
      const param = Reflector.makeParamDecorator((value: string) => value);

      class RawController {
        constructor(@param('raw') value: string) {}
      }

      const metadata = Reflector.collectMetadata(RawController)!;

      expect(metadata.constructor.type).toBe(Class);
      expect(metadata.constructor.decorators).toEqual([]);
      expect(metadata.constructor.params).toEqual([[String, new DecoratorAndValue(param, 'raw')]]);
    });
  });

  describe('delegate constructor detection', () => {
    it('detects native child classes without an own constructor', () => {
      expect(isDelegateCtor('class Child extends Parent {}')).toBe(true);
      expect(isDelegateCtor('class $Child1_ extends Parent { method() {} }')).toBe(true);
    });

    it('detects generated constructors that only delegate to the parent', () => {
      const es5Delegate = 'function Child() { return Parent.apply(this, arguments) || this; }';
      const nativeDelegate = 'class Child extends Parent { constructor() { super(...arguments); this.x = 1; } }';

      expect(isDelegateCtor(es5Delegate)).toBe(true);
      expect(isDelegateCtor(nativeDelegate)).toBe(true);
    });

    it('does not treat an explicit constructor as a delegate constructor', () => {
      expect(isDelegateCtor('class Child extends Parent { constructor(value) { super(value); } }')).toBe(false);
      expect(isDelegateCtor('class Child {}')).toBe(false);
    });
  });
});
