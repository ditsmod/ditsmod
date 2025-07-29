import { Provider } from '#di';
import { SystemErrorMediator } from '#error/system-error-mediator.js';
import { ModuleManager } from '#init/module-manager.js';
import { ShallowImportsBase, ShallowImports } from '#init/types.js';
import { SystemLogMediator } from '#logger/system-log-mediator.js';
import { GlobalProviders } from '#types/metadata-per-mod.js';
import { AnyFn, AnyObj, ModRefId, ModuleType, Override, XOR } from '#types/mix.js';
import { ModuleWithParams, ModuleWithSrcInitMeta } from '#types/module-metadata.js';
import { NormalizedMeta } from '#types/normalized-meta.js';

export type BaseInitRawMeta<T extends object = object> = {
  imports?: XOR<ModRefId, { modRefId: ModRefId } & T>[];
  exports?: any[];
};

/**
 * Init hooks and metadata attached by init decorators,
 * apart from the base decorators - `rootModule` or `featureModule`.
 */
export class InitHooksAndRawMeta<T extends BaseInitRawMeta = BaseInitRawMeta> {
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
  declare hostRawMeta?: T;

  declare baseInitMeta?: BaseInitMeta;

  constructor(public rawMeta: T) {
    this.rawMeta ??= {} as T;
  }

  /**
   * Returns a new instance of the current class. Most likely, you don't need to override this method.
   */
  clone<R extends this>(rawMeta?: T) {
    return new (this.constructor as { new (arg: object): R })(rawMeta || {});
  }

  /**
   * Normalizes the metadata from the current decorator. It is then inserted into `baseMeta.initMeta`.
   *
   * @param baseMeta Normalized metadata that is passed to the `featureModule` or `rootModule` decorator.
   */
  normalize(baseMeta: NormalizedMeta): BaseInitMeta {
    return {};
  }

  /**
   * The returned array of `ModRefId` will be scanned by `ModuleManager`.
   *
   * @param meta Metadata returned by the `this.normalize()` method.
   */
  getModulesToScan(meta?: BaseInitMeta): ModRefId[] {
    return [];
  }

  /**
   * This method gets metadata from `rootModule` to collect providers from the `exports` property.
   */
  exportGlobalProviders(config: {
    moduleManager: ModuleManager;
    globalProviders: GlobalProviders;
    baseMeta: NormalizedMeta;
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
  }): Map<ModRefId, { baseMeta: NormalizedMeta } & AnyObj> {
    return new Map();
  }

  /**
   * By analyzing the dependencies of the providers returned by `ShallowModulesImporter`,
   * recursively collects providers for them from the corresponding modules.
   */
  importModulesDeep(config: {
    metadataPerMod1: { baseMeta: NormalizedMeta } & AnyObj;
    moduleManager: ModuleManager;
    shallowImports: ShallowImports;
    providersPerApp: Provider[];
    log: SystemLogMediator;
    errorMediator: SystemErrorMediator;
  }): any {
    return;
  }
}

/**
 * Assigned to the `initHooksAndRawMeta.baseInitMeta` property.
 */
export class BaseInitMeta<T extends object = AnyObj> {
  importsModules?: ModuleType[];
  importsWithParams?: ModuleWithParams[];
  importsWithModRefId?: ({ modRefId: ModuleWithSrcInitMeta } & T)[];

  exportsModules?: ModuleType[];
  exportsWithParams?: ModuleWithParams[];
  exportsWithModRefId?: ({ modRefId: ModuleWithSrcInitMeta } & T)[];
}

export interface InitMetaMap {
  set<T extends BaseInitMeta>(decorator: AddDecorator<any, T>, params: T): this;
  get<T extends BaseInitMeta>(decorator: AddDecorator<any, T>): T | undefined;
  forEach<T extends BaseInitMeta>(
    callbackfn: (params: T, decorator: AnyFn, map: Map<AnyFn, T>) => void,
    thisArg?: any,
  ): void;
  /**
   * Returns an iterable of keys in the map
   */
  keys(): MapIterator<AnyFn>;
  readonly size: number;
}
/**
 * Use this interface to create decorators with init hooks.
 *
 * ### Complete example with init hooks
 *
 * In this example, `ReturnsType` is the type that will be returned by
 * `myInitHooksAndRawMeta.normalize()` or `normalizedMeta.initMeta.get(addSome)`.
 *
```ts
import {
  makeClassDecorator,
  AddDecorator,
  featureModule,
  InitHooksAndRawMeta,
  BaseInitRawMeta,
  BaseInitMeta,
} from '@ditsmod/core';

interface RawMeta extends BaseInitRawMeta<{ path?: string }> {
  one?: number;
  two?: number;
}
interface InitMeta extends BaseInitMeta<{ path?: string }> {
  other?: string;
}

function getInitHooksAndRawMeta(data?: RawMeta): InitHooksAndRawMeta<RawMeta> {
  const metadata = Object.assign({}, data);
  return new MyInitHooksAndRawMeta(metadata);
}
// Creating an init decorator
export const initSome: AddDecorator<RawMeta, InitMeta> = makeClassDecorator(getInitHooksAndRawMeta);

\@featureModule({ providersPerApp: [{ token: 'token1', useValue: 'value1' }] })
class Module1 {}

// Using the newly created init decorator
\@initSome({ one: 1, two: 2, imports: [{ modRefId: Module1, path: 'some-prefix' }] })
\@featureModule()
class MyModule {
  // Your code here
}

class MyInitHooksAndRawMeta extends InitHooksAndRawMeta<RawMeta> {}
```
 */

export interface AddDecorator<T extends { imports?: (ModRefId | { modRefId: ModRefId })[] }, R> {
  (data?: T): any;
}
