import { Provider } from '#di';
import { SystemErrorMediator } from '#error/system-error-mediator.js';
import { ModuleManager } from '#init/module-manager.js';
import { ShallowImportsBase, ShallowImports } from '#init/types.js';
import { SystemLogMediator } from '#logger/system-log-mediator.js';
import { GlobalProviders } from '#types/metadata-per-mod.js';
import { AnyFn, AnyObj, ModRefId, ModuleType } from '#types/mix.js';
import { BaseMeta } from '#types/base-meta.js';
import { ModuleWithParams } from '#types/module-metadata.js';

export type AllInitHooks = Map<AnyFn, Omit<InitHooksAndRawMeta, 'rawMeta' | 'baseInitMeta'>>;

export interface BaseInitRawMeta<T extends object = object> {
  imports?: ((({ mwp: ModuleWithParams; module?: never } | ModuleWithParams) & T) | ModuleType)[];
  /**
   * List of `ModuleWithParams` or provider tokens exported by this module.
   */
  exports?: any[];
}

/**
 * Init hooks and metadata attached by init decorators,
 * apart from the base decorators - `rootModule` or `featureModule`.
 */
export class InitHooksAndRawMeta<T1 extends AnyObj = AnyObj, T2 extends AnyObj = AnyObj> {
  /**
   * The host module where the current init decorator is declared. If you add this module,
   * it will be imported into the module where the corresponding init decorator is used.
   */
  declare hostModule?: ModRefId;

  /**
   * Allows you to prevent a circular dependency between
   * the module you assign to `this.hostModule` and the decorator for which the current class with
   * init hooks is intended. A circular dependency may occur if `this.hostModule` requires metadata
   * from the decorator that the current class is meant for.
   *
   * For example, if the current class with hooks is created for the `initSomeThing` decorator,
   * which is declared in the host module `SomeModule`, then it's not allowed to simultaneously:
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
   * Normalizes the metadata from the current decorator. It is then inserted into `baseMeta.initMeta`.
   *
   * @param baseMeta Normalized metadata that is passed to the `featureModule` or `rootModule` decorator.
   */
  normalize(baseMeta: BaseMeta) {
    return {} as T2;
  }

  /**
   * The returned array of `ModRefId` will be scanned by `ModuleManager`.
   *
   * @param meta Metadata returned by the `this.normalize()` method.
   */
  getModulesToScan(meta?: T2): ModRefId[] {
    return [];
  }

  /**
   * This method gets metadata from `rootModule` to collect providers from the `exports` property.
   */
  exportGlobalProviders(config: {
    moduleManager: ModuleManager;
    globalProviders: GlobalProviders;
    baseMeta: BaseMeta;
  }): any {
    return;
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
   * By analyzing the dependencies of the providers returned by `ShallowModulesImporter`,
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
  set<T extends AnyObj>(decorator: InitDecorator<any, any, T>, params: T): this;
  get<T extends AnyObj>(decorator: InitDecorator<any, any, T>): T | undefined;
  forEach<T extends AnyObj>(callbackfn: (params: T, decorator: AnyFn, map: Map<AnyFn, T>) => void, thisArg?: any): void;
  /**
   * Returns an iterable of keys in the map
   */
  keys(): MapIterator<AnyFn>;
  values<T extends AnyObj>(): MapIterator<T>;
  readonly size: number;
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
}
/**
 * Use this interface to create decorators with init hooks.
 *
 * ### Complete example with init hooks
 *
 * In this example, `ReturnsType` is the type that will be returned by
 * `myInitHooksAndRawMeta.normalize()` or `baseMeta.initMeta.get(addSome)`.
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

export interface InitDecorator<T1 extends AnyObj, T2, T3> {
  (data?: T1): any;
}
