import { Provider } from '#di';
import { SystemErrorMediator } from '#error/system-error-mediator.js';
import { ModuleManager } from '#init/module-manager.js';
import { ShallowImportsBase, ShallowImports } from '#init/types.js';
import { SystemLogMediator } from '#logger/system-log-mediator.js';
import { GlobalInitHooks, GlobalProviders } from '#types/metadata-per-mod.js';
import { AnyFn, AnyObj, ModRefId, ModuleType } from '#types/mix.js';
import { BaseMeta } from '#types/base-meta.js';
import { ModuleWithParams, type ModuleMetadata } from '#types/module-metadata.js';
import { BaseInitMeta } from '#types/base-meta.js';
import type { ShallowModulesImporter } from '#init/shallow-modules-importer.js';
import type { featureModule } from './feature-module.js';
import type { rootModule } from './root-module.js';

export type AllInitHooks = Map<AnyFn, Omit<InitHooksAndRawMeta, 'rawMeta'>>;

/**
 * Init hooks and metadata attached by init decorators,
 * apart from the base decorators - {@link featureModule} or {@link rootModule}.
 */
export class InitHooksAndRawMeta<T1 extends BaseInitRawMeta = BaseInitRawMeta> {
  /**
   * The host module where the current init decorator is declared. If you add this module,
   * it will be imported into the module where the corresponding init decorator is used.
   */
  declare hostModule?: ModRefId;

  /**
   * Raw metadata intended for the host module.
   * 
   * A module where the class with init hooks is declared (the host module) sometimes requires annotation
   * using its own init decorators, but this can be problematic if you also additionally pass the host module
   * to the {@link hostModule | this.hostModule} property. This causes a circular dependency. To avoid this,
   * you should not annotate the host module using its own decorators. Instead, pass the metadata to this property.
   *
   * For example, if the decorator `initSomeThing` is declared in `SomeModule`,
   * in that case you cannot simultaneously:
   *
   * 1. annotate `SomeModule` using the `initSomeThing` decorator;
   * 2. assign `this.hostModule = SomeModule` in the class with hooks for `initSomeThing`.
   *
   * This would result in a circular dependency, since `SomeModule` depends on `initSomeThing`, and
   * `initSomeThing` depends on `SomeModule`. To avoid this, point 1 must not be performed. Instead,
   * set metadata in this way:
   *
```ts
override hostRawMeta: YourMetadataType = { one: 1, two: 2 };
```
   *
   * Here, `{ one: 1, two: 2 }` represents the placeholder metadata that needs to be passed to `SomeModule`.
   */
  declare hostRawMeta?: T1;

  constructor(public rawMeta: T1) {
    this.rawMeta ??= {} as T1;
  }

  /**
   * Returns a new instance of the current class. Most likely, you don't need to override this method.
   */
  clone<R extends this>(rawMeta?: T1) {
    return new (this.constructor as { new (arg: object): R })(rawMeta || {});
  }

  /**
   * Normalizes the metadata from the current decorator. It is then inserted into {@link BaseMeta.initMeta | baseMeta.initMeta}.
   *
   * @param baseMeta Normalized metadata that is passed
   * to the {@link featureModule} or {@link rootModule} decorator.
   */
  normalize(baseMeta: BaseMeta) {
    return {} as BaseInitMeta;
  }

  /**
   * The returned array of {@link ModRefId} will be scanned by {@link ModuleManager}.
   *
   * @param meta Metadata returned by the {@link normalize | this.normalize()} method.
   */
  getModulesToScan(meta?: BaseInitMeta): ModRefId[] {
    return [];
  }

  /**
   * This method gets metadata from {@link rootModule} decorator to collect
   * providers from the {@link ModuleMetadata.exports | exports } property.
   */
  exportGlobalProviders(config: {
    moduleManager: ModuleManager;
    globalProviders: GlobalProviders;
    baseMeta: BaseMeta;
  }) {
    return new GlobalInitHooks();
  }

  /**
   * Recursively collects providers taking into account module imports/exports,
   * but does not take provider dependencies into account.
   */
  importModulesShallow(config: {
    shallowImportsBase: ShallowImportsBase;
    providersPerApp: Provider[];
    globalProviders: GlobalProviders;
    modRefId: ModRefId;
    unfinishedScanModules: Set<ModRefId>;
  }): Map<ModRefId, { baseMeta: BaseMeta } & AnyObj> {
    return new Map();
  }

  /**
   * By analyzing the dependencies of the providers returned by {@link ShallowModulesImporter },
   * recursively collects providers for them from the corresponding modules.
   */
  importModulesDeep(config: {
    parent: AnyObj;
    metadataPerMod1: { baseMeta: BaseMeta } & AnyObj;
    moduleManager: ModuleManager;
    shallowImports: ShallowImports;
    providersPerApp: Provider[];
    log: SystemLogMediator;
    errorMediator: SystemErrorMediator;
  }): any {
    return;
  }
}

export interface InitMetaMap {
  set<T extends BaseInitMeta>(decorator: InitDecorator<any, any, T>, params: T): this;
  get<T extends BaseInitMeta>(decorator: InitDecorator<any, any, T>): T | undefined;
  forEach<T extends BaseInitMeta>(
    callbackfn: (params: T, decorator: AnyFn, map: Map<AnyFn, T>) => void,
    thisArg?: any,
  ): void;
  /**
   * Returns an iterable of keys in the map
   */
  keys(): MapIterator<AnyFn>;
  values<T extends BaseInitMeta>(): MapIterator<T>;
  readonly size: number;
  [Symbol.iterator](): any;
}

export interface InitParamsMap {
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
 * {@link InitHooksAndRawMeta.normalize} or {@link BaseMeta.initMeta | baseMeta.initMeta.get(addSome)}.
 *
```ts
import {
  makeClassDecorator,
  InitDecorator,
  featureModule,
  InitHooksAndRawMeta,
  ModuleWithInitParams,
} from '@ditsmod/core';

interface RawMeta {
  one?: number;
  two?: number;
}
interface InitMeta {
  other?: string;
}

function getInitHooksAndRawMeta(data?: RawMeta): InitHooksAndRawMeta<RawMeta> {
  const metadata = Object.assign({}, data);
  return new MyInitHooksAndRawMeta(metadata);
}
// Creating an init decorator
export const initSome: InitDecorator<RawMeta, { path?: string }, InitMeta> = makeClassDecorator(getInitHooksAndRawMeta);

\@featureModule({ providersPerApp: [{ token: 'token1', useValue: 'value1' }] })
class Module1 {
  static withParams(): ModuleWithInitParams<Module1> {
    return {
      module: this,
      initParams: new Map(),
    };
  }
}

const moduleWithParams = Module1.withParams();
moduleWithParams.initParams.set(initSome, { path: 'some-prefix' });

// Using the newly created init decorator
\@initSome({ one: 1, two: 2 })
\@featureModule({ imports: [moduleWithParams] })
class MyModule {
  // Your code here
}

class MyInitHooksAndRawMeta extends InitHooksAndRawMeta<RawMeta> {}
```
 */

export interface InitDecorator<T1 extends BaseInitRawMeta, T2, T3> {
  (data?: T1): any;
}

/**
 * MWP - this is module with parameters.
 */
export interface ParamsWithMwp {
  /**
   * Module with parameters.
   */
  mwp: ModuleWithParams;
  module?: never;
}

export interface BaseInitRawMeta<InitParams extends object = object> {
  imports?: (((ParamsWithMwp | ModuleWithParams) & InitParams) | ModuleType)[];
  /**
   * List of {@link ModuleWithParams} or provider tokens exported by this module.
   */
  exports?: any[];
}
