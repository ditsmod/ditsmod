import { Provider } from '#di';
import { SystemErrorMediator } from '#error/system-error-mediator.js';
import { ModuleManager } from '#init/module-manager.js';
import { ShallowImportsBase, ShallowImports } from '#init/types.js';
import { SystemLogMediator } from '#logger/system-log-mediator.js';
import { GlobalProviders } from '#types/metadata-per-mod.js';
import { AnyObj, ModRefId } from '#types/mix.js';
import { NormalizedMeta } from '#types/normalized-meta.js';
import { InitImports } from './feature-module.js';

type ObjectWithImports = { imports?: (ModRefId | { modRefId: ModRefId })[] };

/**
 * Init hooks and metadata attached by init decorators,
 * apart from the base decorators - `rootModule` or `featureModule`.
 */
export class InitHooksAndRawMeta<T extends ObjectWithImports = ObjectWithImports> {
  /**
   * The host module where the current init decorator is declared. If you add this module,
   * it will be imported into the module where the corresponding init decorator is used.
   */
  hostModule?: ModRefId;

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
  hostRawMeta?: T;

  initImports: InitImports;

  constructor(public rawMeta: T) {}

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
  normalize(baseMeta: NormalizedMeta): InitImports {
    return {};
  }

  /**
   * The returned array of `ModRefId` will be scanned by `ModuleManager`.
   *
   * @param meta Metadata returned by the `this.normalize()` method.
   */
  getModulesToScan(meta?: InitImports): ModRefId[] {
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
