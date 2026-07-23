import type { ModuleManager } from '#init/module-manager.js';
import type { ShallowModuleImports } from '#init/types.js';
import type { SystemLogMediator } from '#logger/system-log-mediator.js';
import type { AnyObj } from '#types/mix.js';
import type { ModRefId, StaticModule } from './module-decorator-options.js';
import type { AnyFn, Provider } from '#di/top/types-and-models.js';
import type { DynamicModule, ModuleDecoratorOptions } from '#decorators/module-decorator-options.js';
import type { ShallowModulesImporter } from '#init/shallow-modules-importer.js';
import type { featureModule } from './feature-module.js';
import type { rootModule } from './root-module.js';
import { AppInitHooks, type AppProviders } from '#types/metadata-per-mod.js';
import { type NormalizedModuleMeta, getProxyForInitMeta, NormalizedInitMeta } from '#init/normalized-meta.js';
import type { ForwardRefFn } from '#di/forward-ref.js';

export type AllInitHooks = Map<AnyFn, Omit<InitHooks, 'decoratorOptions'>>;

/**
 * Init hooks and metadata attached by init decorators,
 * apart from the base decorators - {@link featureModule} or {@link rootModule}.
 */
export class InitHooks<T1 extends InitDecoratorOptions = InitDecoratorOptions> {
  /**
   * If you want your init decorator to also play the role of a base module, substitute the appropriate role.
   */
  declare moduleRole?: 'root' | 'feature';
  /**
   * The host module where the current init decorator is declared. If you add this module,
   * it will be imported into the module where the corresponding init decorator is used.
   */
  declare hostModule?: StaticModule;

  /**
   * Options intended for the host module.
   *
   * Sometimes, the host module (where the init hook class is declared) needs to be decorated
   * with its own init decorator. If you do this and also set {@link hostModule}, it creates
   * a circular dependency.
   *
   * To prevent this, do not decorate the host module with its own decorator. Instead,
   * pass its metadata to this property:
   *
   * ```ts
   * override hostDecoratorOptions: YourMetadataType = { one: 1, two: 2 };
   * ```
   */
  declare hostDecoratorOptions?: T1;

  constructor(public decoratorOptions: T1) {
    this.decoratorOptions ??= {} as T1;
  }

  /**
   * Returns a new instance of the current class. Most likely, you don't need to override this method.
   */
  clone<R extends this>(decoratorOptions?: T1) {
    return new (this.constructor as { new (arg: object): R })(decoratorOptions || {});
  }

  /**
   * Normalizes the metadata from the current decorator. It is then inserted into {@link NormalizedModuleMeta.initMeta | normalizedModuleMeta.initMeta}.
   *
   * @param normalizedModuleMeta Normalized metadata that is passed
   * to the {@link featureModule} or {@link rootModule} decorator.
   */
  normalize(normalizedModuleMeta: NormalizedModuleMeta) {
    return getProxyForInitMeta(normalizedModuleMeta, NormalizedInitMeta);
  }

  /**
   * The returned array of {@link ModRefId} will be scanned by {@link ModuleManager}.
   *
   * @param meta Metadata returned by the {@link normalize | this.normalize()} method.
   */
  getModulesToScan(meta?: NormalizedInitMeta): ModRefId[] {
    return [];
  }

  /**
   * This method gets metadata from {@link rootModule} decorator to collect
   * providers from the {@link ModuleDecoratorOptions.exports | exports } property.
   */
  exportAppProviders(config: {
    moduleManager: ModuleManager;
    appProviders: AppProviders;
    normalizedModuleMeta: NormalizedModuleMeta;
  }) {
    return new AppInitHooks();
  }

  /**
   * Recursively collects providers taking into account module imports/exports,
   * but does not take provider dependencies into account.
   */
  importModulesShallow(config: {
    moduleManager: ModuleManager;
    appProviders: AppProviders;
    modRefId: ModRefId;
    unfinishedScanModules: Set<ModRefId>;
  }): Map<ModRefId, { normalizedModuleMeta: NormalizedModuleMeta } & AnyObj> {
    return new Map();
  }

  /**
   * By analyzing the dependencies of the providers returned by {@link ShallowModulesImporter },
   * recursively collects providers for them from the corresponding modules.
   */
  importModulesDeep(config: {
    parent: AnyObj;
    shallowModuleImports: { normalizedModuleMeta: NormalizedModuleMeta } & AnyObj;
    moduleManager: ModuleManager;
    shallowModuleImportsMap: Map<ModRefId, ShallowModuleImports>;
    providersPerApp: Provider[];
    log: SystemLogMediator;
  }): any {
    return;
  }
  /**
   * This method must return a mutable array of {@link Provider} arrays, which can be overridden during testing.
   */
  getProvidersToOverride(meta: NormalizedInitMeta): Provider[][] {
    return [];
  }
}

export interface InitMetaMap {
  set<T extends NormalizedInitMeta>(decorator: InitDecorator<any, any, T>, meta: T): this;
  get<T extends NormalizedInitMeta>(decorator: InitDecorator<any, any, T>): T | undefined;
  forEach<T extends NormalizedInitMeta>(
    callbackfn: (meta: T, decorator: AnyFn, map: Map<AnyFn, T>) => void,
    thisArg?: any,
  ): void;
  /**
   * Returns an iterable of keys in the map
   */
  keys(): MapIterator<AnyFn>;
  values<T extends NormalizedInitMeta>(): MapIterator<T>;
  readonly size: number;
  /**
   * @returns boolean indicating whether an element with the specified key exists or not.
   */
  has(key: AnyFn): boolean;
  [Symbol.iterator](): any;
}

export interface InitDynamicOptionsMap {
  set<T extends AnyObj>(decorator: InitDecorator<any, T, any>, params: T): this;
  get<T extends AnyObj>(decorator: InitDecorator<any, T, any>): T | undefined;
  forEach<T extends AnyObj>(callbackfn: (params: T, decorator: AnyFn, map: Map<AnyFn, T>) => void, thisArg?: any): void;
  /**
   * Returns an iterable of keys in the map
   */
  keys(): MapIterator<AnyFn>;
  values<T extends AnyObj>(): MapIterator<T>;
  readonly size: number;
  /**
   * @returns boolean indicating whether an element with the specified key exists or not.
   */
  has(key: InitDecorator<any, any, any>): boolean;
}

/**
 * Use this interface to create decorators with init hooks.
 *
 * ### Complete example with init hooks
 *
 * In this example, `ReturnsType` is the type that will be returned by
 * {@link InitHooks.normalize} or {@link NormalizedModuleMeta.initMeta | normalizedModuleMeta.initMeta.get(addSome)}.
 *
```ts
import {
  makeClassDecorator,
  InitDecorator,
  featureModule,
  InitHooks,
  DynamicModuleWithInit,
} from '@ditsmod/core';

interface RootDecoratorOptions {
  one?: number;
  two?: number;
}
interface InitMeta {
  other?: string;
}

function getInitHooks(data?: RootDecoratorOptions): InitHooks<RootDecoratorOptions> {
  const metadata = Object.assign({}, data);
  return new MyInitHooks(metadata);
}
// Creating an init decorator
export const initSome: InitDecorator<RootDecoratorOptions, { path?: string }, InitMeta> = makeClassDecorator(getInitHooks);

@featureModule({ providersPerApp: [{ token: 'token1', useValue: 'value1' }] })
class Module1 {
  static withOpts(): DynamicModuleWithInit<Module1> {
    return {
      module: this,
      initOpts: new Map(),
    };
  }
}

const dynamicModule = Module1.withOpts();
dynamicModule.initOpts.set(initSome, { path: 'some-prefix' });

// Using the newly created init decorator
@initSome({ one: 1, two: 2 })
@featureModule({ imports: [dynamicModule] })
class MyModule {
  // Your code here
}

class MyInitHooks extends InitHooks<RootDecoratorOptions> {}
```
 */
export interface InitDecorator<T extends InitDecoratorOptions, ModuleParams, InitMeta> {
  (data?: T): any;
}

/**
 * Dynamic module wrapper with additional custom options.
 */
export interface DynamicModuleWrapper {
  /**
   * Dynamic module.
   */
  dynamicModule: DynamicModule;
  module?: never;
}

export interface InitDecoratorOptions<InitDynamicOptions extends object = object> extends Omit<
  ModuleDecoratorOptions,
  'imports'
> {
  imports?: (((DynamicModuleWrapper | DynamicModule) & InitDynamicOptions) | StaticModule | ForwardRefFn<StaticModule>)[];
}
