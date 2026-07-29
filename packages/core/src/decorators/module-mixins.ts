import type { ModuleManager } from '#init/module-manager.js';
import type { ShallowModuleImports } from '#init/types.js';
import type { SystemLogMediator } from '#logger/system-log-mediator.js';
import type { AnyObj } from '#types/mix.js';
import type { ModRefId, StaticModule } from './module-decorator-options.js';
import type { AnyFn, Provider } from '#di/top/types-and-models.js';
import type { DynamicModule, FeatureModuleOptions } from '#decorators/module-decorator-options.js';
import type { ShallowModulesImporter } from '#init/shallow-modules-importer.js';
import type { featureModule } from './feature-module.js';
import type { rootModule } from './root-module.js';
import { AppModuleMixins, type AppProviders } from '#types/metadata-per-mod.js';
import { type NormalizedModuleMeta, getProxyForMixinMeta, NormalizedMixinMeta } from '#init/normalized-meta.js';
import type { ForwardRefFn } from '#di/forward-ref.js';

export type AllModuleMixins = Map<AnyFn, Omit<ModuleMixin, 'moduleOptions'>>;

/**
 * Module mixins and metadata attached by mixin decorators,
 * apart from the base decorators - {@link featureModule} or {@link rootModule}.
 */
export class ModuleMixin<T1 extends MixinOptions = MixinOptions> {
  /**
   * If you want your mixin decorator to also play the role of a base module, substitute the appropriate role.
   */
  declare moduleRole?: 'root' | 'feature';
  /**
   * The host module where the current mixin decorator is declared. If you add this module,
   * it will be imported into the module where the corresponding mixin decorator is used.
   */
  declare hostModule?: StaticModule;

  /**
   * Options intended for the host module.
   *
   * Sometimes, the host module (where the module mixin class is declared) needs to be decorated
   * with its own mixin decorator. If you do this and also set {@link hostModule}, it creates
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

  constructor(public moduleOptions: T1) {
    this.moduleOptions ??= {} as T1;
  }

  /**
   * Returns a new instance of the current class. Most likely, you don't need to override this method.
   */
  clone<R extends this>(moduleOptions?: T1) {
    return new (this.constructor as { new (arg: object): R })(moduleOptions || {});
  }

  /**
   * Normalizes the metadata from the current decorator. It is then inserted into {@link NormalizedModuleMeta.mixinMeta | normalizedModuleMeta.mixinMeta}.
   *
   * @param normalizedModuleMeta Normalized metadata that is passed
   * to the {@link featureModule} or {@link rootModule} decorator.
   */
  normalize(normalizedModuleMeta: NormalizedModuleMeta) {
    return getProxyForMixinMeta(normalizedModuleMeta, NormalizedMixinMeta);
  }

  /**
   * The returned array of {@link ModRefId} will be scanned by {@link ModuleManager}.
   *
   * @param meta Metadata returned by the {@link normalize | this.normalize()} method.
   */
  getModulesToScan(meta?: NormalizedMixinMeta): ModRefId[] {
    return [];
  }

  /**
   * This method gets metadata from {@link rootModule} decorator to collect
   * providers from the {@link FeatureModuleOptions.exports | exports } property.
   */
  exportAppProviders(config: {
    moduleManager: ModuleManager;
    appProviders: AppProviders;
    normalizedModuleMeta: NormalizedModuleMeta;
  }) {
    return new AppModuleMixins();
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
  getProvidersToOverride(meta: NormalizedMixinMeta): Provider[][] {
    return [];
  }
}

export interface MixinMetaMap {
  set<T extends NormalizedMixinMeta>(decorator: MixinDecorator<any, any, T>, meta: T): this;
  get<T extends NormalizedMixinMeta>(decorator: MixinDecorator<any, any, T>): T | undefined;
  forEach<T extends NormalizedMixinMeta>(
    callbackfn: (meta: T, decorator: AnyFn, map: Map<AnyFn, T>) => void,
    thisArg?: any,
  ): void;
  /**
   * Returns an iterable of keys in the map
   */
  keys(): MapIterator<AnyFn>;
  values<T extends NormalizedMixinMeta>(): MapIterator<T>;
  readonly size: number;
  /**
   * @returns boolean indicating whether an element with the specified key exists or not.
   */
  has(key: AnyFn): boolean;
  [Symbol.iterator](): any;
}

export interface MixinDynamicOptionsMap {
  set<T extends AnyObj>(decorator: MixinDecorator<any, T, any>, params: T): this;
  get<T extends AnyObj>(decorator: MixinDecorator<any, T, any>): T | undefined;
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
  has(key: MixinDecorator<any, any, any>): boolean;
}

/**
 * Use this interface to create decorators with module mixins.
 *
 * ### Complete example with module mixins
 *
 * In this example, `ReturnsType` is the type that will be returned by
 * {@link ModuleMixin.normalize} or {@link NormalizedModuleMeta.mixinMeta | normalizedModuleMeta.mixinMeta.get(addSome)}.
 *
```ts
import {
  makeClassDecorator,
  MixinDecorator,
  featureModule,
  ModuleMixin,
  DynamicModuleWithMixinOptions,
} from '@ditsmod/core';

interface RootModuleOptions {
  one?: number;
  two?: number;
}
interface MixinMeta {
  other?: string;
}

function getModuleMixin(data?: RootModuleOptions): ModuleMixin<RootModuleOptions> {
  const metadata = Object.assign({}, data);
  return new MyModuleMixin(metadata);
}
// Creating an mixin decorator
export const mixinSome: MixinDecorator<RootModuleOptions, { path?: string }, MixinMeta> = makeClassDecorator(getModuleMixin);

@featureModule({ providersPerApp: [{ token: 'token1', useValue: 'value1' }] })
class Module1 {
  static withOpts(): DynamicModuleWithMixinOptions<Module1> {
    return {
      module: this,
      mixinOptions: new Map(),
    };
  }
}

const dynamicModule = Module1.withOpts();
dynamicModule.mixinOptions.set(mixinSome, { path: 'some-prefix' });

// Using the newly created mixin decorator
@mixinSome({ one: 1, two: 2 })
@featureModule({ imports: [dynamicModule] })
class MyModule {
  // Your code here
}

class MyModuleMixin extends ModuleMixin<RootModuleOptions> {}
```
 */
export interface MixinDecorator<T extends MixinOptions, ModuleParams, MixinMeta> {
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

// prettier-ignore
export interface MixinOptions<MixinDynamicOptions extends object = object> extends Omit<FeatureModuleOptions,'imports'> {
  imports?: (
    ((DynamicModuleWrapper | DynamicModule) & MixinDynamicOptions) | StaticModule | ForwardRefFn<ModRefId>
  )[];
}
