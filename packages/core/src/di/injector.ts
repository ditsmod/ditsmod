import { format } from 'node:util';

import { AnyFn } from '#types/mix.js';
import { fromSelf, inject, optional, skipSelf } from './decorators.js';
import {
  cyclicDependencyError,
  instantiationError,
  invalidProviderError,
  mixMultiProvidersWithRegularProvidersError,
  noAnnotationError,
  noProviderError,
} from './error-handling.js';
import { resolveForwardRef } from './forward-ref.js';
import { InjectionToken } from './injection-token.js';
import { DualKey, KeyRegistry } from './key-registry.js';
import { reflector } from './reflection.js';
import {
  Class,
  DecoratorAndValue,
  Dependency,
  DiError,
  ID,
  NormalizedProvider,
  ParamsMeta,
  Provider,
  RegistryOfInjector,
  ResolvedFactory,
  ResolvedProvider,
  Visibility,
  getNewRegistry,
} from './types-and-models.js';
import {
  DEBUG_NAME,
  isClassProvider,
  isFactoryProvider,
  isFunctionFactoryProvider,
  isNormalizedProvider,
  isTypeProvider,
  isValueProvider,
  stringify,
} from './utils.js';

const NoDefaultValue = Symbol();
const msg1 = 'Setting value by ID failed: cannot find ID in register: "%d". Try use injector.setByToken()';
const msg2 =
  'Setting value by token failed: cannot find token in register: "%s". Try adding a provider ' +
  'with the same token to the current injector via module or controller metadata.';

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
  #parent: Injector | null;
  #registry: RegistryOfInjector;
  #Registry: Class<RegistryOfInjector>;

  /**
   * @param injectorName Injector name. Useful for debugging.
   */
  constructor(
    Registry: Class<RegistryOfInjector>,
    parent?: Injector,
    protected readonly injectorName?: string,
  ) {
    this.#Registry = Registry;
    this.#registry = new Registry();
    this.#parent = parent || null;
  }

  /**
   * Turns an array of provider definitions into an array of resolved providers.
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
  static resolve(providers: Provider[]): ResolvedProvider[] {
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
    Registry?: Class<RegistryOfInjector>,
  ): Class<RegistryOfInjector> {
    if (!Registry) {
      Registry = getNewRegistry();
    }
    providers.forEach((p) => {
      Registry!.prototype[p.dualKey.id] = p;
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
   * @param injectorName Injector name. Useful for debugging.
   */
  static resolveAndCreate(providers: Provider[], injectorName?: string): Injector {
    const resolvedProviders = this.resolve(providers);
    return this.fromResolvedProviders(resolvedProviders, injectorName);
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
  * @param injectorName Injector name. Useful for debugging.
   */
  static fromResolvedProviders(providers: ResolvedProvider[], injectorName?: string): Injector {
    return new Injector(this.prepareRegistry(providers), undefined, injectorName);
  }

  protected static normalizeProviders(
    providers: Provider[],
    normProviders: NormalizedProvider[],
  ): NormalizedProvider[] {
    providers.forEach((provider) => {
      if (isTypeProvider(provider)) {
        normProviders.push({ token: provider, useClass: provider });
      } else if (isNormalizedProvider(provider)) {
        normProviders.push(provider);
      } else {
        throw invalidProviderError(provider);
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
      const factoryFn = (...args: any[]) => new Cls(...args);
      const resolvedDeps = this.getDependencies(Cls);
      return [this.getResolvedProvider(provider.token, factoryFn, resolvedDeps, provider.multi)];
    } else if (isValueProvider(provider)) {
      return [this.getResolvedProvider(provider.token, () => provider.useValue, [], provider.multi)];
    } else if (isFactoryProvider(provider)) {
      if (isFunctionFactoryProvider(provider)) {
        const token = provider.token || provider.useFactory;
        const factoryFn = (...args: any[]) => provider.useFactory(...args);
        const resolvedDeps = (provider.deps || []).map((d) => {
          const dualKey = KeyRegistry.get(d);
          return Dependency.fromDualKey(dualKey);
        });
        return [this.getResolvedProvider(token, factoryFn, resolvedDeps, provider.multi)];
      }
      const [rawClass, rawFactory] = provider.useFactory;
      const Cls = resolveForwardRef(rawClass) as Class;
      const factory = resolveForwardRef(rawFactory) as AnyFn;
      const token = provider.token || factory;
      if (typeof factory == 'function') {
        (factory as any)[DEBUG_NAME] = `${Cls.name}.prototype.${factory.name}`;
      } else {
        const msg =
          `Failed to create factory provider for ${stringify(token)}:` +
          `second argument in tuple of useFactory must be a function, got ${typeof factory}`;
        throw new DiError(msg);
      }
      const factoryKey = this.getFactoryKey(Cls, factory);
      const resolvedDeps1 = this.getDependencies(Cls);
      const resolvedDeps2 = this.getDependencies(Cls, factoryKey);
      const numArgs2 = resolvedDeps2.length;
      const factoryFn = (...args: any[]) => {
        const args1 = args.slice(numArgs2);
        const args2 = args.slice(0, numArgs2);
        return new Cls(...args1)[factoryKey](...args2);
      };
      const deps = [...resolvedDeps2, ...resolvedDeps1];
      return [this.getResolvedProvider(token, factoryFn, deps, provider.multi)];
    } else {
      // Token provider.
      const factoryFn = (aliasInstance: any) => aliasInstance;
      const dualKey = KeyRegistry.get(provider.useToken);
      const resolvedDeps = [Dependency.fromDualKey(dualKey)];
      return [this.getResolvedProvider(provider.token, factoryFn, resolvedDeps, provider.multi)];
    }
  }

  protected static getResolvedProvider(token: any, factoryFn: AnyFn, resolvedDeps: Dependency[], isMulti?: boolean) {
    const dualKey = KeyRegistry.get(token);
    const resolvedFactory = new ResolvedFactory(factoryFn, resolvedDeps);
    isMulti = isMulti || false;
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
        const fn = Cls.prototype[prop] as Function;
        if (fn === factory) {
          return prop;
        }
      }

      const msg = `Cannot find "${factory.name || 'anonymous'}()" as method in "${Cls.name}".`;
      throw new DiError(msg);
    }

    const msg = `Cannot find method in "${Cls.name}".`;
    throw new DiError(msg);
  }

  protected static getDependencies(Cls: Class, propertyKey?: string | symbol): Dependency[] {
    const aParamsMeta = reflector.getParamsMetadata(Cls, propertyKey);
    if (aParamsMeta.some((p) => p === null)) {
      throw noAnnotationError(Cls, aParamsMeta, propertyKey);
    }
    return aParamsMeta.map((paramsMeta) => {
      const { token, isOptional, visibility } = this.extractPayload(paramsMeta!);
      if (token != null) {
        return new Dependency(KeyRegistry.get(token), isOptional, visibility);
      } else {
        throw noAnnotationError(Cls, aParamsMeta, propertyKey);
      }
    });
  }

  protected static extractPayload(paramsMeta: ParamsMeta) {
    let token: any = null;
    let isOptional = false;

    let visibility: Visibility = null;

    for (let i = 0; i < paramsMeta.length; ++i) {
      const paramsItem = paramsMeta[i];

      if (paramsItem instanceof DecoratorAndValue) {
        const { decorator } = paramsItem;
        if (decorator === inject) {
          token = paramsItem.value;
        } else if (decorator === optional) {
          isOptional = true;
        } else if (decorator === fromSelf || decorator === skipSelf) {
          visibility = decorator;
        }
      } else {
        token = paramsItem;
      }
    }

    token = resolveForwardRef(token);
    return { token, isOptional, visibility };
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
          throw mixMultiProvidersWithRegularProvidersError(existing.dualKey.token);
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
  get parent(): Injector | null {
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
   * @param injectorName Injector name. Useful for debugging.
   */
  resolveAndCreateChild(providers: Provider[], injectorName?: string): Injector {
    const resolvedProviders = Injector.resolve(providers);
    return this.createChildFromResolved(resolvedProviders, injectorName);
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
   * @param injectorName Injector name. Useful for debugging.
   */
  createChildFromResolved(providers: ResolvedProvider[], injectorName?: string): Injector {
    return new Injector(Injector.prepareRegistry(providers), this, injectorName);
  }

  /**
   * Sets value in injector registry by its ID that is
   * generated by `KeyRegistry.get()` for given token.
   *
   * @param id The ID from KeyRegistry for some token.
   * @param value New value for this ID.
   */
  setById(id: number, value: any) {
    if (id in this.#registry) {
      this.#registry[id] = value;
      return this;
    }

    throw new DiError(format(msg1, id));
  }

  /**
   * Sets value in injector registry by its token.
   *
   * @param value New value for this ID.
   */
  setByToken(token: any, value: any) {
    const { id } = KeyRegistry.get(token);
    if (id in this.#registry) {
      this.#registry[id] = value;
      return this;
    }

    const displayToken = stringify(token);
    throw new DiError(format(msg2, displayToken));
  }

  clear(): void {
    this.#Registry = undefined as any;
    this.#registry = undefined as any;
    this.#parent = undefined as any;
  }

  /**
   * Resolves a provider and instantiates an object in the context of the injector.
   *
   * The created object does not get cached by the injector, but create the cache of its dependecies.
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
  resolveAndInstantiate(provider: Provider): any {
    const resolvedProvider = Injector.resolve([provider])[0];
    return this.instantiateResolved(resolvedProvider);
  }

  /**
   * Retrieves an instance from the injector based on the provided token.
   * If not found, returns the `defaultValue` otherwise.
   */
  get<T>(token: Class<T> | InjectionToken<T>, visibility?: Visibility, defaultValue?: T): T;
  get<T extends AnyFn>(token: T, visibility?: Visibility, defaultValue?: T): ReturnType<T>;
  get(token: any, visibility?: Visibility, defaultValue?: any): any;
  /**
   * @todo Refactor function signature for abstract classes, because this is not work:
   *
   * ```ts
   * abstract class A {}
   * injector.get(A) // Infer return type as "any".
   * ```
   */
  get(token: any, visibility: Visibility = null, defaultValue: any = NoDefaultValue): any {
    return this.selectInjectorAndGet(KeyRegistry.get(token), [], visibility, defaultValue);
  }

  protected selectInjectorAndGet(dualKey: DualKey, parentTokens: any[], visibility: Visibility, defaultValue: any) {
    if (dualKey.token === Injector) {
      return this;
    }

    const injector = visibility === skipSelf ? this.#parent : this;
    return this.getOrThrow(injector, dualKey, parentTokens, defaultValue, visibility);
  }

  protected getOrThrow(
    injector: Injector | null,
    dualKey: DualKey,
    parentTokens: any[],
    defaultValue: any,
    visibility?: Visibility,
  ): any {
    if (injector) {
      const meta = injector.#registry[dualKey.id];

      // This is an alternative to the "instanceof ResolvedProvider" expression.
      if (meta?.[ID]) {
        if (parentTokens.includes(dualKey.token)) {
          throw cyclicDependencyError([dualKey.token, ...parentTokens]);
        }
        const value = injector.instantiateResolved(meta, parentTokens);
        return (injector.#registry[dualKey.id] = value);
      } else if (meta !== undefined) {
        // Here "meta" - is a value for provider that has given `token`.
        return meta;
      } else if (visibility !== fromSelf && injector.#parent) {
        return injector.#parent.getOrThrow(injector.#parent, dualKey, parentTokens, defaultValue);
      }
    }
    if (defaultValue === NoDefaultValue) {
      throw noProviderError([dualKey.token, ...parentTokens]);
    } else {
      return defaultValue;
    }
  }

  /**
   * Instantiates an object using a resolved provider in the context of the injector.
   *
   * The created object does not get cached by the injector, but create the cache of its dependecies.
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
   */
  instantiateResolved<T = any>(provider: ResolvedProvider, parentTokens: any[] = []): T {
    if (provider.multi) {
      return provider.resolvedFactories.map((factory) => {
        return this.instantiate(provider.dualKey.token, parentTokens, factory);
      }) as T;
    } else {
      return this.instantiate(provider.dualKey.token, parentTokens, provider.resolvedFactories[0]);
    }
  }

  protected instantiate(token: any, parentTokens: any[], resolvedFactory: ResolvedFactory): any {
    const deps = resolvedFactory.dependencies.map((dep) => {
      return this.selectInjectorAndGet(
        dep.dualKey,
        [token, ...parentTokens],
        dep.visibility,
        dep.optional ? undefined : NoDefaultValue,
      );
    });

    try {
      return resolvedFactory.factory(...deps);
    } catch (e: any) {
      throw instantiationError(e, [token, ...parentTokens]);
    }
  }

  /**
   * If the nearest provider with the given `token` is in the parent injector, then
   * this method pulls that provider into the current injector. After that, it works
   * the same as `injector.get()`. If the nearest provider with the given `token`
   * is in the current injector, then this method behaves exactly like `injector.get()`.
   * 
   * This method is useful if you don't use `ValueProvider` for requested `token`. And this method
   * is primarily useful because it allows you, in the context of the current injector, to create
   * instances of providers that depend on a particular configuration that may be different in
   * the current and parent injectors.
   *
   * ## Example
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
child.get(Service).config; // now, in current injector, works cache: { one: 11, two: 22 }
   * ```
   */
  pull<T>(token: Class<T> | InjectionToken<T>, defaultValue?: T): T;
  pull<T extends AnyFn>(token: T, defaultValue?: T): ReturnType<T>;
  pull(token: any, defaultValue?: any): any;
  pull(token: any, defaultValue: any = NoDefaultValue): any {
    const dualKey = KeyRegistry.get(token);
    const meta = this.#registry[dualKey.id];

    // This is an alternative to the "instanceof ResolvedProvider" expression.
    if (meta?.[ID]) {
      const value = this.instantiateResolved(meta, []);
      return (this.#registry[dualKey.id] = value);
    } else if (meta !== undefined) {
      // Here "meta" - is a value for provider that has given `token`.
      return meta;
    }

    if (this.#parent) {
      const resolvedProvider = this.getResolvedProvider(this.#parent, dualKey);
      if (resolvedProvider) {
        const value = this.instantiateResolved(resolvedProvider, []);
        return (this.#registry[dualKey.id] = value);
      }
    }
    if (defaultValue === NoDefaultValue) {
      throw noProviderError([dualKey.token]);
    } else {
      return defaultValue;
    }
  }

  protected getResolvedProvider(injector: Injector, dualKey: DualKey): ResolvedProvider | void {
    const resolvedProvider = injector.#Registry.prototype[dualKey.id] as ResolvedProvider | undefined;

    if (resolvedProvider) {
      return resolvedProvider;
    } else if (injector.#parent) {
      return injector.#parent.getResolvedProvider(injector.#parent, dualKey);
    }
  }

  /**
   * Returns provider's value from registry by ID.
   */
  getValue(id: number) {
    return this.#registry[id];
  }
}
