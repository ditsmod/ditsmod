import { ClassMetaIterator } from './class-meta-iterator.js';
import { Reflector, isDelegateCtor } from './reflector.js';
import { DecoratorAndValue } from './top/decorator-and-value.js';
import { DEPS_KEY } from './top/constants.js';
import type { DepsMeta } from './top/resolved-provider.js';
import { Class, UnknownType } from './top/types-and-models.js';

describe('Reflector behavior', () => {
  describe('class decorators', () => {
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
      expect(decorators?.[0]).toMatchObject({
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
      expect(Reflector.getRawPropMeta(UsersController, symbolKey)).toEqual(
        new DecoratorAndValue(route, { method: 'POST', path: '/users' }),
      );
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

  describe('parameter metadata', () => {
    it('merges reflected parameter types with constructor and method parameter decorators', () => {
      const param = Reflector.makeParamDecorator((token: string) => ({ token }));

      class UserService {}
      class AuditService {}

      class UsersController {
        constructor(
          @param('users') users: UserService,
          plain: string,
          @param('audit') audit: AuditService,
        ) {}

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

      expect(Reflector.getRawParamMeta(UsersController, 'handle')).toEqual([null, null, [new DecoratorAndValue(param, 'third')]]);
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

      expect(metadata.constructor.params).toEqual([
        [ParentParam, new DecoratorAndValue(param, 'parent')],
      ]);
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
      expect(Reflector.getRawParamMeta(RawController)).toEqual([
        [new DecoratorAndValue(paramTag, 'raw-param')],
      ]);
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
