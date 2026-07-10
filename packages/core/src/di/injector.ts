import { input, fromSelf, inject, type InjectTransformResult, optional, skipSelf } from './decorators.js';
import {
  FailedCreateFactoryProvider,
  InstantiationError,
  InvalidProvider,
  MixMultiWithRegularProviders,
  NoAnnotation,
  NoProvider,
  CannotFindFactoryAsMethod,
  CannotFindMethodInClass,
} from './errors.js';
import { type ForwardRefFn, resolveForwardRef } from './forward-ref.js';
import type { InjectionToken } from './top/injection-token.js';
import type { DualKey } from './key-registry.js';
import { KeyRegistry } from './key-registry.js';
import { Reflector } from './reflector.js';
import type {
  Class,
  NormalizedProvider,
  ParameterMeta,
  Provider,
  Visibility,
  CompareFn,
  AbstractClass,
  AnyFn,
  FactoryProvider,
} from './top/types-and-models.js';
import {
  type DepsMeta,
  type RegistryOfInjector,
  Dependency,
  ID,
  ResolvedFactory,
  ResolvedProvider,
  getNewRegistry,
} from './top/resolved-provider.js';
import { DecoratorMeta } from './top/decorator-and-value.js';
import { DEPS_KEY } from './top/constants.js';
import { PathTracer } from './path-tracer.js';
import {
  isClassProvider,
  isFactoryProvider,
  isFunctionFactoryProvider,
  isNormalizedProvider,
  isTypeProvider,
  isValueProvider,
  type MultiProvider,
} from './utils.js';
import { DEBUG_NAME } from './stringify.js';
import { ParentParams } from './parent-params.js';

export type LevelOfInjector = 'App' | 'Mod' | 'Rou' | 'Req' | (string & {});

const NoDefaultValue = Symbol();
const OptionalNullishToken = Symbol('OptionalWithoutToken');

/**
 * A dependency injection container used for instantiating objects and resolving
 * dependencies.
 *
 * An `Injector` is a replacement for a `new` operator, which can automatically resolve the
 * constructor dependencies.
 *
 * In typical use, application code asks for the dependencies in the constructor and they are
 * resolved by the `Injector`.
 *
 * ### Example
 *
 * The following example creates an `Injector` configured to create `Engine` and `Car`.
 *
```ts
@injectable()
class Engine {
}

@injectable()
class Car {
  constructor(public engine:Engine) {}
}

const injector = Injector.resolveAndCreate([Car, Engine]);
const car = injector.get(Car);
expect(car instanceof Car).toBe(true);
expect(car.engine instanceof Engine).toBe(true);
```
 *
 * Notice, we don't use the `new` operator because we explicitly want to have the `Injector`
 * resolve all of the object's dependencies automatically.
 */
export class Injector {
  #parent: Injector | undefined;
  #registry: RegistryOfInjector;
  #Registry: typeof RegistryOfInjector;
  #level?: LevelOfInjector;

  get level() {
    return this.#level;
  }

  /**
   * @param level name of the injector. Useful for debugging.
   */
  constructor(Registry: typeof RegistryOfInjector, level?: LevelOfInjector, parent?: Injector) {
    this.#Registry = Registry;
    this.#registry = new Registry();
    this.#parent = parent;
    this.#level = level;
  }

  /**
   * Turns an array of provider definitions into an array of resolved providers.
   * For this method, it does not matter if all dependencies are present in the passed array,
   * but it is essential that the metadata of each provider can be read (so that each provider
   * with dependencies in the constructor has a decorator).
   *
   * A resolution is a process of converting individual
   * providers into an array of `ResolvedProvider`.
   *
   * ### Example
   *
  ```ts
import { injectable, Injector } from '@ditsmod/core';

@injectable()
class Engine {}

@injectable()
class Car {
  constructor(public engine: Engine) {}
}

const providers = Injector.resolve([Car, Engine]);
console.log(providers[0].resolvedFactories[0].dependencies);
  ```
   *
   * See `fromResolvedProviders` for more info.
   */
  static resolve(providers: (Provider | ForwardRefFn<Provider>)[]): ResolvedProvider[] {
    const normalized = this.normalizeProviders(providers, []);
    const aResolvedProviders: ResolvedProvider[] = [];
    normalized.forEach((normProvider) => {
      aResolvedProviders.push(...this.resolveProvider(normProvider));
    });
    const map = this.mergeResolvedProviders(aResolvedProviders, new Map());
    return Array.from(map.values());
  }

  /**
   * Create new or extends existing class of registry. Where "class of registry" means
   * just class that has resolved providers in its prototype,
   * where property names are taken from resolved providers IDs.
   *
   * @param Registry If provided, `providers` extends the `Registry`.
   */
  static prepareRegistry(
    providers: ResolvedProvider[],
    Registry?: typeof RegistryOfInjector,
  ): typeof RegistryOfInjector {
    if (!Registry) {
      Registry = getNewRegistry();
    }
    providers.forEach((p) => {
      Registry.prototype[p.dualKey.id] = p;
    });
    return Registry;
  }

  /**
   * Resolves an array of providers and creates an injector from those providers.
   *
   * The passed-in providers can be an array of `Class`, `Provider`.
   *
   * ### Example
   *
```ts
@injectable()
class Engine {
}

@injectable()
class Car {
  constructor(public engine:Engine) {}
}

const injector = Injector.resolveAndCreate([Car, Engine]);
expect(injector.get(Car) instanceof Car).toBe(true);
```
   *
   * This function is slower than the corresponding `fromResolvedProviders`
   * because it needs to resolve the passed-in providers first.
   * See `Injector.resolve()` and `Injector.fromResolvedProviders()`.
   * 
   * @param level Injector name. Useful for debugging.
   */
  static resolveAndCreate(providers: Provider[], level?: LevelOfInjector): Injector {
    const resolvedProviders = this.resolve(providers);
    return this.fromResolvedProviders(resolvedProviders, level);
  }

  /**
   * Creates an injector from previously resolved providers.
   *
   * This API is the recommended way to construct injectors in performance-sensitive parts.
   *
   * ### Example
   *
```ts
@injectable()
class Engine {
}

@injectable()
class Car {
  constructor(public engine:Engine) {}
}

const providers = Injector.resolve([Car, Engine]);
const injector = Injector.fromResolvedProviders(providers);
expect(injector.get(Car) instanceof Car).toBe(true);
```
  *
  * @param level Injector name. Useful for debugging.
   */
  static fromResolvedProviders(providers: ResolvedProvider[], level?: LevelOfInjector): Injector {
    return new Injector(this.prepareRegistry(providers), level);
  }

  protected static normalizeProviders(
    providers: (Provider | ForwardRefFn<Provider>)[],
    normProviders: NormalizedProvider[],
  ): NormalizedProvider[] {
    providers.forEach((provider) => {
      provider = resolveForwardRef(provider);
      if (isTypeProvider(provider)) {
        normProviders.push({ token: provider, useClass: provider });
      } else if (isNormalizedProvider(provider)) {
        normProviders.push(provider);
      } else {
        throw new InvalidProvider(provider);
      }
    });

    return normProviders;
  }

  /**
   * Resolve a single provider.
   */
  protected static resolveProvider(provider: NormalizedProvider): ResolvedProvider[] {
    if (isClassProvider(provider)) {
      const Cls = resolveForwardRef(provider.useClass) as Class;
      const depsMeta = this.getDependencies(Cls);
      const factoryFn = depsMeta.hasParentParams
        ? (...args: any[]) => new Cls(...ParentParams.getArgs(depsMeta.recipe!, args))
        : (...args: any[]) => new Cls(...args);
      return [this.getResolvedProvider(provider, provider.token, factoryFn, depsMeta.deps, provider.multi)];
    } else if (isValueProvider(provider)) {
      return [this.getResolvedProvider(provider, provider.token, () => provider.useValue, [], provider.multi)];
    } else if (isFactoryProvider(provider)) {
      return this.resolveFactoryProvider(provider);
    } else {
      // Token provider.
      const factoryFn = (aliasInstance: any) => aliasInstance;
      const dualKey = KeyRegistry.get(provider.useToken);
      const resolvedDeps = [Dependency.fromDualKey(dualKey)];
      return [this.getResolvedProvider(provider, provider.token, factoryFn, resolvedDeps, provider.multi)];
    }
  }

  protected static resolveFactoryProvider(provider: FactoryProvider) {
    if (isFunctionFactoryProvider(provider)) {
      const token = provider.token || provider.useFactory;
      const factoryFn = (...args: any[]) => provider.useFactory(...args);
      const resolvedDeps = (provider.deps || []).map((d) => {
        const dualKey = KeyRegistry.get(d);
        return Dependency.fromDualKey(dualKey);
      });
      return [this.getResolvedProvider(provider, token, factoryFn, resolvedDeps, provider.multi)];
    }
    const [rawClass, rawFactory] = provider.useFactory;
    const Cls = resolveForwardRef(rawClass) as Class;
    const factory = resolveForwardRef(rawFactory) as AnyFn;
    const token = provider.token || factory;
    if (typeof factory == 'function') {
      (factory as any)[DEBUG_NAME] = `${Cls.name}.prototype.${factory.name}`;
    } else {
      throw new FailedCreateFactoryProvider(token, typeof factory);
    }
    const factoryKey = this.getFactoryKey(Cls, factory);
    const depsMeta = this.getDependencies(Cls);
    const resolvedDeps2 = this.getDependencies(Cls, factoryKey).deps;
    const numArgs2 = resolvedDeps2.length;
    let factoryFn: AnyFn;
    if (depsMeta.hasParentParams) {
      factoryFn = (...args: any[]) => {
        const args1 = args.slice(numArgs2);
        const args2 = args.slice(0, numArgs2);
        return new Cls(...ParentParams.getArgs(depsMeta.recipe!, args1))[factoryKey](...args2);
      };
    } else {
      factoryFn = (...args: any[]) => {
        const args1 = args.slice(numArgs2);
        const args2 = args.slice(0, numArgs2);
        return new Cls(...args1)[factoryKey](...args2);
      };
    }
    const deps = [...resolvedDeps2, ...depsMeta.deps];
    return [this.getResolvedProvider(provider, token, factoryFn, deps, provider.multi)];
  }

  protected static getResolvedProvider(
    provider: Provider,
    token: NonNullable<unknown>,
    factoryFn: AnyFn,
    resolvedDeps: Dependency[],
    isMulti?: boolean,
  ) {
    const dualKey = KeyRegistry.get(token);
    const resolvedFactory = new ResolvedFactory(factoryFn, resolvedDeps);
    isMulti ??= false;
    if (isMulti) {
      resolvedFactory.provider = provider as MultiProvider;
    }
    return new ResolvedProvider(dualKey, [resolvedFactory], isMulti);
  }

  /**
   * When an user give a class factory provider (eg. `{ useFactory: [Class, Class.prototype.factoryKey] }`),
   * "factory key" means "property key in class that has factory".
   */
  protected static getFactoryKey(Cls: Class, factory: AnyFn): string | symbol {
    if (typeof factory == 'function') {
      const methods: (string | symbol)[] = Object.getOwnPropertyNames(Cls.prototype);
      const symMethods = Object.getOwnPropertySymbols(Cls.prototype);
      methods.push(...symMethods);
      for (const prop of methods) {
        if (typeof Cls.prototype[prop] != 'function' || prop == 'constructor') {
          continue;
        }
        const fn = Cls.prototype[prop] as AnyFn;
        if (fn === factory) {
          return prop;
        }
      }

      throw new CannotFindFactoryAsMethod(factory.name, Cls.name);
    }

    throw new CannotFindMethodInClass(Cls.name);
  }

  protected static getDependencies(Cls: Class, propertyKey?: string | symbol): DepsMeta {
    const classPropMeta = Reflector.collectMeta(Cls, propertyKey);
    if (!classPropMeta) {
      return { deps: [] };
    }
    const cache = classPropMeta[DEPS_KEY];
    if (cache) {
      return cache;
    }
    const { aParamsMeta, hasParentParams, recipe } = ParentParams.getParamsMetaAndRecipe([
      ...classPropMeta.paramChain!.values(),
    ]);
    if (aParamsMeta.includes(null)) {
      throw new NoAnnotation(Cls, aParamsMeta, propertyKey, hasParentParams, recipe);
    }
    const deps = (aParamsMeta as ParameterMeta[]).map((parameterMeta) => {
      const { token, input, isOptional, visibility } = this.extractPayload(parameterMeta);
      if (token != null) {
        return new Dependency(KeyRegistry.get(token), isOptional, visibility, input);
      } else if (isOptional) {
        return new Dependency(KeyRegistry.get(OptionalNullishToken), true, visibility, input);
      } else {
        throw new NoAnnotation(Cls, aParamsMeta, propertyKey);
      }
    });

    const depsMeta = { deps, hasParentParams, recipe } satisfies DepsMeta;
    classPropMeta[DEPS_KEY] = depsMeta;

    return depsMeta;
  }

  protected static extractPayload(parameterMeta: ParameterMeta) {
    let token: any = null;
    let input: any = undefined;
    let isOptional = false;

    let visibility: Visibility = null;

    for (let i = 0; i < parameterMeta.length; ++i) {
      const parameterItem = parameterMeta[i];

      if (parameterItem instanceof DecoratorMeta) {
        const { decoratorId } = parameterItem;
        if (decoratorId === inject) {
          token = (parameterItem.value as InjectTransformResult).token;
          input = (parameterItem.value as InjectTransformResult).input;
        } else if (decoratorId === optional) {
          isOptional = true;
        } else if (decoratorId === fromSelf || decoratorId === skipSelf) {
          visibility = decoratorId;
        }
      } else {
        token = parameterItem;
      }
    }

    token = resolveForwardRef(token);
    return { token, input, isOptional, visibility };
  }

  /**
   * Merges a list of ResolvedProviders into a list where
   * each token is contained exactly once and multi providers
   * have been merged.
   */
  protected static mergeResolvedProviders(
    resolvedProviders: ResolvedProvider[],
    normalizedProvidersMap: Map<number, ResolvedProvider>,
  ): Map<number, ResolvedProvider> {
    for (let i = 0; i < resolvedProviders.length; i++) {
      const provider = resolvedProviders[i];
      const existing = normalizedProvidersMap.get(provider.dualKey.id);
      if (existing) {
        if (provider.multi !== existing.multi) {
          throw new MixMultiWithRegularProviders(existing.dualKey.token);
        }
        if (provider.multi) {
          for (let j = 0; j < provider.resolvedFactories.length; j++) {
            existing.resolvedFactories.push(provider.resolvedFactories[j]);
          }
        } else {
          normalizedProvidersMap.set(provider.dualKey.id, provider);
        }
      } else {
        let resolvedProvider: ResolvedProvider;
        if (provider.multi) {
          resolvedProvider = new ResolvedProvider(provider.dualKey, provider.resolvedFactories.slice(), provider.multi);
        } else {
          resolvedProvider = provider;
        }
        normalizedProvidersMap.set(provider.dualKey.id, resolvedProvider);
      }
    }
    return normalizedProvidersMap;
  }

  /**
   * Parent of this injector.
   *
   * ### Example
   *
```ts
const parent = Injector.resolveAndCreate([]);
const child = parent.resolveAndCreateChild([]);
expect(child.parent).toBe(parent);
```
   *
   */
  get parent(): Injector | undefined {
    return this.#parent;
  }

  /**
   * Resolves an array of providers and creates a child injector from those providers.
   *
   * The passed-in providers can be an array of `Class` or `Provider`.
   *
   * ### Example
   *
```ts
class ParentProvider {}
class ChildProvider {}

const parent = Injector.resolveAndCreate([ParentProvider]);
const child = parent.resolveAndCreateChild([ChildProvider]);

expect(child.get(ParentProvider) instanceof ParentProvider).toBe(true);
expect(child.get(ChildProvider) instanceof ChildProvider).toBe(true);
expect(child.get(ParentProvider)).toBe(parent.get(ParentProvider));
```
   *
   * This function is slower than the corresponding `createChildFromResolved`
   * because it needs to resolve the passed-in providers first.
   *
   * See `Injector.resolve()` and `Injector.createChildFromResolved()`.
   * 
   * @param level Injector name. Useful for debugging.
   */
  resolveAndCreateChild(providers: Provider[], level?: LevelOfInjector): Injector {
    const resolvedProviders = Injector.resolve(providers);
    return this.createChildFromResolved(resolvedProviders, level);
  }

  /**
   * Creates a child injector from previously resolved providers.
   *
   * This API is the recommended way to construct injectors in performance-sensitive parts.
   *
   * ### Example
   *
```ts
class ParentProvider {}
class ChildProvider {}

const parentProviders = Injector.resolve([ParentProvider]);
const childProviders = Injector.resolve([ChildProvider]);

const parent = Injector.fromResolvedProviders(parentProviders);
const child = parent.createChildFromResolved(childProviders);

expect(child.get(ParentProvider) instanceof ParentProvider).toBe(true);
expect(child.get(ChildProvider) instanceof ChildProvider).toBe(true);
expect(child.get(ParentProvider)).toBe(parent.get(ParentProvider));
```
   *
   * @param level Injector name. Useful for debugging.
   */
  createChildFromResolved(providers: ResolvedProvider[], level?: LevelOfInjector): Injector {
    return new Injector(Injector.prepareRegistry(providers), level, this);
  }

  /**
   * Resolves a provider and instantiates an object in the context of the injector.
   *
   * The created object does not get cached by the injector, but create the cache of its dependencies.
   *
   * ### Example
   *
```ts
@injectable()
class Engine {
}

@injectable()
class Car {
  constructor(public engine:Engine) {}
}

const injector = Injector.resolveAndCreate([Engine]);

const car = injector.resolveAndInstantiate(Car);
expect(car.engine).toBe(injector.get(Engine));
expect(car).not.toBe(injector.resolveAndInstantiate(Car));
```
   */
  resolveAndInstantiate(provider: Provider, input?: NonNullable<unknown>): any {
    const resolvedProvider = Injector.resolve([provider])[0];
    return this.instantiateResolved(resolvedProvider, input);
  }

  /**
   * Retrieves an instance from the injector based on the provided token.
   * If not found, returns the `defaultValue` otherwise.
   *
   * @param defaultValue Any default value except `undefined`. If you specify a default value and
   * the injector cannot find a value for the provider with the specified `token`, the injector will
   * not throw an error and will return the default value.
   * @param input Context data that you can pass to the injector for the provider with the specified `token`.
   * If that provider specifies a dependency on [input][1] decorator, it can retrieve this data. If you pass
   * context data, the injector does not use or create a cache for the provider with the specified token.
   *
   * [1]: https://ditsmod.github.io/en/basic-components/dependency-injection/#inject-and-input
   */
  get<T extends Class | AbstractClass>(
    token: T,
    defaultValue?: InstanceType<T> | null,
    input?: any,
    visibility?: Visibility,
  ): InstanceType<T>;
  get<T>(token: InjectionToken<T>, defaultValue?: T, input?: any, visibility?: Visibility): T;
  get<T extends AnyFn>(token: T, defaultValue?: T, input?: any, visibility?: Visibility): ReturnType<T>;
  get(token: NonNullable<unknown>, defaultValue?: any, input?: any, visibility?: Visibility): any;
  get(
    token: NonNullable<unknown>,
    defaultValue: any = NoDefaultValue,
    input?: any,
    visibility: Visibility = null,
  ): any {
    return this.selectInjectorAndGet(KeyRegistry.get(token), new PathTracer(), visibility, defaultValue, input);
  }

  /**
   * Works identically to {@link get | injector.get()}, but by default returns type `any`.
   *
   * @param defaultValue Any default value except `undefined`. If you specify a default value and
   * the injector cannot find a value for the provider with the specified `token`, the injector will
   * not throw an error and will return the default value.
   * @param input Context data that you can pass to the injector for the provider with the specified `token`.
   * If that provider specifies a dependency on [input][1] decorator, it can retrieve this data. If you pass
   * context data, the injector does not use or create a cache for the provider with the specified token.
   *
   * [1]: https://ditsmod.github.io/en/basic-components/dependency-injection/#inject-and-input
   */
  getAny<T = any>(
    token: NonNullable<unknown>,
    defaultValue: any = NoDefaultValue,
    input?: any,
    visibility: Visibility = null,
  ): T {
    return this.selectInjectorAndGet(KeyRegistry.get(token), new PathTracer(), visibility, defaultValue, input);
  }

  /**
   * This method is appropriate to use when the initialization order within a single group of multi-providers
   * with the specified `token` is important. The comparison function `compareFn` accepts multi-provider
   * objects as its first and second parameters.
   *
   * __Warning!__ This method does not guarantee the initialization of multi-providers in the order
   * returned by `compareFn` if there is a direct or indirect dependency between them.
   *
   * @param token Multi-provider token.
   * @param compareFn Function used to determine the order of the value from multi-providers. It is expected to return
   * a negative value if the first argument is less than the second argument, zero if they're equal, and a positive
   * value otherwise.
   * @param defaultValue Any default value except `undefined`. If you specify a default value and
   * the injector cannot find a value for the provider with the specified `token`, the injector will
   * not throw an error and will return the default value.
   * @param input Context data that you can pass to the injector for the provider with the specified `token`.
   * If that provider specifies a dependency on [input][1] decorator, it can retrieve this data. If you pass
   * context data, the injector does not use or create a cache for the provider with the specified token.
   *
   * [1]: https://ditsmod.github.io/en/basic-components/dependency-injection/#inject-and-input
   */
  getOrderedMultiValues<T extends Provider = Provider, A = any>(
    token: NonNullable<unknown>,
    compareFn: CompareFn<T>,
    defaultValue: any = NoDefaultValue,
    input?: any,
  ): A[] {
    return this.selectInjectorAndGet(KeyRegistry.get(token), new PathTracer(), null, defaultValue, input, compareFn);
  }

  protected selectInjectorAndGet(
    dualKey: DualKey,
    pathTracer: PathTracer,
    visibility: Visibility,
    defaultValue: any,
    input?: NonNullable<unknown>,
    compareFn?: CompareFn,
  ) {
    if (dualKey.token === Injector) {
      return this;
    }

    const injector = visibility === skipSelf ? this.parent : this;
    return this.getOrThrow(injector, dualKey, pathTracer, defaultValue, visibility, input, compareFn);
  }

  /**
   * @param injector This parameter can only be `null` if the `skipSelf` decorator is used.
   */
  protected getOrThrow(
    injector: Injector | undefined,
    dualKey: DualKey,
    pathTracer: PathTracer,
    defaultValue: any,
    visibility?: Visibility,
    input?: NonNullable<unknown>,
    compareFn?: CompareFn,
  ): any {
    pathTracer.addItem(dualKey.token, injector);
    if (injector) {
      if (input == null) {
        const meta = injector.#registry[dualKey.id];

        // This is an alternative to the "instanceof ResolvedProvider" expression.
        if (meta?.[ID]) {
          const value = injector._instantiateResolved(meta, undefined, compareFn, pathTracer);
          return (injector.#registry[dualKey.id] = value);
        } else if (meta !== undefined || injector.hasId(dualKey.id)) {
          // Here "meta" - is a value for provider that has given `token`.
          return meta;
        } else if (visibility !== fromSelf && injector.parent) {
          return injector.parent.getOrThrow(injector.parent, dualKey, pathTracer, defaultValue, undefined);
        }
      } else {
        const resolvedProvider = this.getResolvedProvider(this, dualKey);
        if (resolvedProvider) {
          return this._instantiateResolved(resolvedProvider, input, compareFn, new PathTracer());
        }
      }
    }
    if (defaultValue === NoDefaultValue) {
      throw new NoProvider(pathTracer.path);
    } else {
      return defaultValue;
    }
  }

  /**
   * Instantiates an object using a resolved provider in the context of the injector.
   *
   * The created object does not get cached by the injector.
   *
   * ### Example
   *
```ts
@injectable()
class Engine {
}

@injectable()
class Car {
  constructor(public engine:Engine) {}
}

const injector = Injector.resolveAndCreate([Engine]);
const carProvider = Injector.resolve([Car])[0];
const car = injector.instantiateResolved(carProvider);
expect(car.engine).toBe(injector.get(Engine));
expect(car).not.toBe(injector.instantiateResolved(carProvider));
```
   *
   * @param input The context with which this provider should be resolved.
   */
  instantiateResolved<T = any>(provider: ResolvedProvider, input?: NonNullable<unknown>): T {
    return this._instantiateResolved(provider, input);
  }

  protected _instantiateResolved<T = any>(
    provider: ResolvedProvider,
    input?: NonNullable<unknown>,
    compareFn?: CompareFn,
    pathTracer: PathTracer = new PathTracer(),
  ): T {
    if (provider.multi) {
      let resolvedFactories: ResolvedFactory[];
      if (typeof compareFn == 'function') {
        resolvedFactories = provider.resolvedFactories.toSorted((a, b) => {
          return compareFn(a.provider as MultiProvider, b.provider as MultiProvider);
        });
      } else {
        resolvedFactories = provider.resolvedFactories;
      }
      return resolvedFactories.map((factory) => {
        return this.instantiate(provider.dualKey.token, pathTracer, factory, input);
      }) as T;
    } else {
      return this.instantiate(provider.dualKey.token, pathTracer, provider.resolvedFactories[0], input);
    }
  }

  protected instantiate(
    token: any,
    pathTracer: PathTracer,
    resolvedFactory: ResolvedFactory,
    inputCtx?: NonNullable<unknown>,
  ): any {
    const deps = resolvedFactory.dependencies.map((dep) => {
      if (dep.dualKey.token === input) return inputCtx;
      const result = this.selectInjectorAndGet(
        dep.dualKey,
        pathTracer,
        dep.visibility,
        dep.optional ? undefined : NoDefaultValue,
        dep.input,
      );
      pathTracer.removeFirstToken();
      return result;
    });

    try {
      return resolvedFactory.factory(...deps);
    } catch (e: any) {
      // @todo Review this logic
      throw new InstantiationError(e, pathTracer.path.length ? pathTracer.path : [token]);
    }
  }

  /**
   * This method makes sense to use only in a child injector when it lacks a certain provider available
   * in the parent injector, and that provider depends on another provider that is present in the child injector.
   * 
   * For example, when `Service` depends on `Config`, and `Service` exists only in the parent injector,
   * while `Config` exists in both the parent and child injectors:
   * 
   * ```ts
import { injectable, Injector } from '@ditsmod/core';

class Config {
  one: any;
  two: any;
}

@injectable()
class Service {
  constructor(public config: Config) {}
}

const parent = Injector.resolveAndCreate([Service, { token: Config, useValue: { one: 1, two: 2 } }]);
const child = parent.resolveAndCreateChild([{ token: Config, useValue: { one: 11, two: 22 } }]);
child.get(Service).config; // returns from parent injector: { one: 1, two: 2 }
child.pull(Service).config; // pulls Service in current injector: { one: 11, two: 22 }
   * ```
   *
   * As you can see, if you use `child.get(Service)` in this case, `Service` will be created with
   * the `Config` from the parent injector. However, if you use `child.pull(Service)`, it will
   * first pull the required provider into the child injector and then create its value in the context
   * of the child injector without adding it to the injector cache (i.e., `child.pull(Service)` will
   * return a new instance each time).
   */
  pull<T>(token: Class<T> | InjectionToken<T>, defaultValue?: T): T;
  pull<T extends AnyFn>(token: T, defaultValue?: T): ReturnType<T>;
  pull(token: NonNullable<unknown>, defaultValue?: any): any;
  pull(token: NonNullable<unknown>, defaultValue: any = NoDefaultValue): any {
    const pathTracer = new PathTracer();
    pathTracer.addItem(token, this);
    const dualKey = KeyRegistry.get(token);
    const meta = this.#registry[dualKey.id];

    // This is an alternative to the "instanceof ResolvedProvider" expression.
    if (meta?.[ID]) {
      const value = this._instantiateResolved(meta, undefined, undefined, pathTracer);
      return (this.#registry[dualKey.id] = value);
    } else if (meta !== undefined || this.hasId(dualKey.id)) {
      // Here "meta" - is a value for provider that has given `token`.
      return meta;
    }

    if (this.parent) {
      const resolvedProvider = this.getResolvedProvider(this.parent, dualKey);
      if (resolvedProvider) {
        return this._instantiateResolved(resolvedProvider, undefined, undefined, pathTracer);
      }
    }
    if (defaultValue === NoDefaultValue) {
      throw new NoProvider([dualKey.token]);
    } else {
      return defaultValue;
    }
  }

  protected getResolvedProvider(injector: Injector, dualKey: DualKey): ResolvedProvider | void {
    const resolvedProvider = injector.#Registry.prototype[dualKey.id] as ResolvedProvider | undefined;

    if (resolvedProvider) {
      return resolvedProvider;
    } else if (injector.parent) {
      return injector.parent.getResolvedProvider(injector.parent, dualKey);
    }
  }

  getResolvedProviderFromPrototype(id: number) {
    return this.#Registry.prototype[id];
  }

  hasId(id: number) {
    return Object.hasOwn(this.#registry, id);
  }
}
