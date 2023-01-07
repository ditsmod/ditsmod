import {
  Visibility,
  ParamsMeta,
  Provider,
  NormalizedProvider,
  DiError,
  RESOLVED_PROVIDER,
  PreparedFactory,
} from './types-and-models';
import { Dependency, ResolvedFactory, ResolvedProvider, Class, DecoratorAndValue } from './types-and-models';
import { fromSelf, skipSelf, inject, optional } from './decorators';
import {
  cyclicDependencyError,
  instantiationError,
  noProviderError,
  invalidProviderError,
  noAnnotationError,
  mixMultiProvidersWithRegularProvidersError,
} from './error-handling';
import { reflector } from './reflection';
import { resolveForwardRef } from './forward-ref';
import { InjectionToken } from './injection-token';
import {
  isClassProvider,
  isFactoryProvider,
  isNormalizedProvider,
  isTypeProvider,
  DEBUG_NAME,
  stringify,
  isValueProvider,
} from './utils';

const THROW_IF_NOT_FOUND = Symbol();
type Func = (...args: any[]) => any;

/**
 * A ReflectiveDependency injection container used for instantiating objects and resolving
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
  #map: Map<any, ResolvedProvider>;
  private countOfProviders = 0;
  private constructionCounter = 0;

  /**
   * @param injectorName Injector name. Useful for debugging.
   */
  constructor(map: Map<any, ResolvedProvider>, parent?: Injector | Injector, public readonly injectorName?: string) {
    this.#map = new Map(map);
    this.#parent = parent || null;
    this.countOfProviders = map.size;
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
import 'reflect-metadata';

import { injectable, Injector } from './di';

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
  static resolve(providers: Provider[]): Map<any, ResolvedProvider> {
    const normalized = this.normalizeProviders(providers, []);
    const aResolvedProviders: ResolvedProvider[] = [];
    normalized.forEach((normProvider) => {
      aResolvedProviders.push(...this.resolveProvider(normProvider));
    });
    return this.mergeResolvedProviders(aResolvedProviders, new Map());
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
  static fromResolvedProviders(providers: Map<any, ResolvedProvider>, injectorName?: string): Injector {
    return new Injector(providers, undefined, injectorName);
  }

  private static normalizeProviders(providers: Provider[], normProviders: NormalizedProvider[]): NormalizedProvider[] {
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
  private static resolveProvider(provider: NormalizedProvider): ResolvedProvider[] {
    if (isClassProvider(provider)) {
      const Cls = resolveForwardRef(provider.useClass) as Class;
      const factoryFn = (...args: any[]) => new Cls(...args);
      const resolvedDeps = this.getDependencies(Cls);
      return [this.getResolvedProvider(provider.token, factoryFn, resolvedDeps, provider.multi)];
    } else if (isValueProvider(provider)) {
      return [this.getResolvedProvider(provider.token, () => provider.useValue, [], provider.multi)];
    } else if (isFactoryProvider(provider)) {
      const [rawClass, rawFactory] = provider.useFactory;
      const Cls = resolveForwardRef(rawClass) as Class;
      const factory = resolveForwardRef(rawFactory) as Func;
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
      const factoryFn = (aliasInstance: any) => aliasInstance;
      const resolvedDeps = [Dependency.fromToken(provider.useToken)];
      return [this.getResolvedProvider(provider.token, factoryFn, resolvedDeps, provider.multi)];
    }
  }

  private static getResolvedProvider(token: any, factoryFn: Func, resolvedDeps: Dependency[], isMulti?: boolean) {
    token = resolveForwardRef(token);
    const resolvedFactory = new ResolvedFactory(factoryFn, resolvedDeps);
    isMulti = isMulti || false;
    return new ResolvedProvider(token, [resolvedFactory], isMulti);
  }

  /**
   * When an user give a class factory provider (eg. `{ useFactory: [Class, Cls.prototype.factoryKey] }`),
   * "factory key" means "property key in class that has factory".
   */
  private static getFactoryKey(Cls: Class, factory: Func): string | symbol {
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

  private static getDependencies(Cls: Class, propertyKey?: string | symbol): Dependency[] {
    const aParamsMeta = reflector.getParamsMetadata(Cls, propertyKey);
    if (aParamsMeta.some((p) => p === null)) {
      throw noAnnotationError(Cls, aParamsMeta, propertyKey);
    }
    return aParamsMeta.map((paramsMeta) => {
      const { token, isOptional, visibility } = this.extractPayload(paramsMeta!);
      if (token != null) {
        return new Dependency(token, isOptional, visibility);
      } else {
        throw noAnnotationError(Cls, aParamsMeta, propertyKey);
      }
    });
  }

  private static extractPayload(paramsMeta: ParamsMeta) {
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
  private static mergeResolvedProviders(
    resolvedProviders: ResolvedProvider[],
    normalizedProvidersMap: Map<any, ResolvedProvider>
  ): Map<any, ResolvedProvider> {
    for (let i = 0; i < resolvedProviders.length; i++) {
      const provider = resolvedProviders[i];
      const existing = normalizedProvidersMap.get(provider.token);
      if (existing) {
        if (provider.multi !== existing.multi) {
          throw mixMultiProvidersWithRegularProvidersError(existing.token);
        }
        if (provider.multi) {
          for (let j = 0; j < provider.resolvedFactories.length; j++) {
            existing.resolvedFactories.push(provider.resolvedFactories[j]);
          }
        } else {
          normalizedProvidersMap.set(provider.token, provider);
        }
      } else {
        let resolvedProvider: ResolvedProvider;
        if (provider.multi) {
          resolvedProvider = new ResolvedProvider(provider.token, provider.resolvedFactories.slice(), provider.multi);
        } else {
          resolvedProvider = provider;
        }
        normalizedProvidersMap.set(provider.token, resolvedProvider);
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
    const resolvedReflectiveProviders = Injector.resolve(providers);
    return this.createChildFromResolved(resolvedReflectiveProviders, injectorName);
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
  createChildFromResolved(providers: Map<any, ResolvedProvider>, injectorName?: string): Injector {
    return new Injector(providers, this, injectorName);
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
    const map = Injector.resolve([provider]).values();
    const resolvedProvider = Array.from(map)[0];
    return this.instantiateResolved(resolvedProvider);
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
  instantiateResolved(provider: ResolvedProvider, parentTokens: any[] = []): any {
    if (provider.multi) {
      const res = new Array(provider.resolvedFactories.length);
      for (let i = 0; i < provider.resolvedFactories.length; ++i) {
        res[i] = this.instantiate(provider.token, parentTokens, provider.resolvedFactories[i]);
      }
      return res;
    } else {
      return this.instantiate(provider.token, parentTokens, provider.resolvedFactories[0]);
    }
  }

  prepareResolved(provider: ResolvedProvider, parentTokens: any[] = [], skipFirst?: number): PreparedFactory {
    // if (provider.multi) {
    //   const res = new Array(provider.resolvedFactories.length);
    //   for (let i = 0; i < provider.resolvedFactories.length; ++i) {
    //     const args = this.prepareArgs(provider.token, parentTokens, provider.resolvedFactories[i].dependencies);
    //     res[i] = [provider.resolvedFactories[i].factory, args];
    //   }
    //   return res;
    // } else {
    const deps = provider.resolvedFactories[0].dependencies.slice(skipFirst);
    const args = this.prepareArgs(provider.token, parentTokens, deps);
    return [provider.resolvedFactories[0].factory, args];
    // }
  }
  
  /**
   * Retrieves an instance from the injector based on the provided token.
   * If not found, returns the `notFoundValue` otherwise
   */
  get<T>(token: Class<T> | InjectionToken<T>, visibility?: Visibility, notFoundValue?: T): T;
  get(token: any, visibility?: Visibility, notFoundValue?: any): any;
  get(token: any, visibility: Visibility = null, notFoundValue: any = THROW_IF_NOT_FOUND): any {
    return this.checkVisibilityAndGet(token, [], visibility, notFoundValue);
  }

  getFactoryWithArgs(
    token: Func,
    skipFirst: number,
    visibility: Visibility = null,
    notFoundValue: any = THROW_IF_NOT_FOUND
  ): PreparedFactory {
    return this.checkVisibilityAndGet(token, [], visibility, notFoundValue, skipFirst);
  }

  /**
   * An analogue of `injector.get()`, but this method only checks the presence
   * of dependencies for given token. In this case, an instance of the corresponding
   * class is not created, the action bound to `useFactory` is not executed, etc.
   *
   * If there are problems with dependencies, throws the corresponding error.
   */
  checkDeps(token: any, visibility: Visibility = null, notFoundValue: any = THROW_IF_NOT_FOUND): any {
    return this.checkVisibilityAndCheckDeps(token, [], visibility, notFoundValue);
  }

  private instantiate(token: any, parentTokens: any[], resolvedFactory: ResolvedFactory): any {
    const deps = resolvedFactory.dependencies.map((dep) => {
      return this.checkVisibilityAndGet(
        dep.token,
        [token, ...parentTokens],
        dep.visibility,
        dep.optional ? null : THROW_IF_NOT_FOUND
      );
    });

    try {
      return resolvedFactory.factory(...deps);
    } catch (e: any) {
      throw instantiationError(e, [token, ...parentTokens]);
    }
  }

  private prepareArgs(token: any, parentTokens: any[], dependencies: Dependency[]): any[] {
    return dependencies.map((dep) => {
      return this.checkVisibilityAndGet(
        dep.token,
        [token, ...parentTokens],
        dep.visibility,
        dep.optional ? null : THROW_IF_NOT_FOUND
      );
    });
  }

  private checkVisibilityAndGet(
    token: any,
    parentTokens: any[],
    visibility: Visibility,
    notFoundValue: any,
    skipFirst?: number
  ) {
    if (token === Injector) {
      return this;
    }

    const injector = visibility === skipSelf ? this.#parent : this;
    const onlyFromSelf = visibility === fromSelf;
    return this.getOrThrow(injector, token, parentTokens, notFoundValue, onlyFromSelf, skipFirst);
  }

  private getOrThrow(
    inj: Injector | null,
    token: any,
    parentTokens: any[],
    notFoundValue: any,
    onlyFromSelf?: boolean,
    skipFirst?: number
  ): any {
    if (inj) {
      const value: ResolvedProvider | undefined = inj.#map.get(token);
      if (!value && !inj.#map.has(token)) {
        if (!onlyFromSelf && inj.#parent) {
          return inj.#parent.getOrThrow(inj.#parent, token, parentTokens, notFoundValue);
        }
      } else if (value?.[RESOLVED_PROVIDER]) {
        if (inj.constructionCounter++ > inj.countOfProviders) {
          throw cyclicDependencyError([value.token, ...parentTokens]);
        }
        if (skipFirst) {
          const newValue = inj.prepareResolved(value, parentTokens, skipFirst);
          inj.#map.set(token, newValue as any);
          return newValue;
        } else {
          const newValue = inj.instantiateResolved(value, parentTokens);
          inj.#map.set(token, newValue);
          return newValue;
        }
      } else {
        return value as any;
      }
    }
    if (notFoundValue !== THROW_IF_NOT_FOUND) {
      return notFoundValue;
    } else {
      throw noProviderError([token, ...parentTokens]);
    }
  }

  private checkMultiOrRegularDeps(provider: ResolvedProvider, parentTokens: any[] = []): any {
    if (provider.multi) {
      provider.resolvedFactories.forEach(({ dependencies }) => {
        this.runDry(provider.token, parentTokens, dependencies);
      });
    } else {
      return this.runDry(provider.token, parentTokens, provider.resolvedFactories[0].dependencies);
    }
  }

  private runDry(token: any, parentTokens: any[], dependencies: Dependency[]): any {
    dependencies.forEach((dep) => {
      return this.checkVisibilityAndCheckDeps(
        dep.token,
        [token, ...parentTokens],
        dep.visibility,
        dep.optional ? null : THROW_IF_NOT_FOUND
      );
    });
  }

  private checkVisibilityAndCheckDeps(token: any, parentTokens: any[], visibility: Visibility, notFoundValue?: any) {
    if (token === Injector) {
      return;
    }

    const injector = visibility === skipSelf ? this.#parent : this;
    const onlyFromSelf = visibility === fromSelf;
    return this.runDryOrThrow(injector, token, parentTokens, notFoundValue, onlyFromSelf);
  }

  private runDryOrThrow(
    inj: Injector | null,
    token: any,
    parentTokens: any[],
    notFoundValue?: any,
    onlyFromSelf?: boolean
  ): any {
    if (inj) {
      const value: ResolvedProvider | undefined = inj.#map.get(token);
      if (!value && !inj.#map.has(token)) {
        if (!onlyFromSelf && inj.#parent) {
          return inj.#parent.runDryOrThrow(inj.#parent, token, parentTokens, notFoundValue);
        }
      } else if (value?.[RESOLVED_PROVIDER]) {
        inj.checkMultiOrRegularDeps(value, parentTokens);
        return;
      } else {
        return;
      }
    }
    if (notFoundValue !== THROW_IF_NOT_FOUND) {
      return notFoundValue;
    } else {
      throw noProviderError([token, ...parentTokens]);
    }
  }
}
