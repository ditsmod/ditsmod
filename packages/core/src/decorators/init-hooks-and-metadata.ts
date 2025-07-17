import { Provider } from '#di';
import { SystemErrorMediator } from '#error/system-error-mediator.js';
import { ModuleManager } from '#init/module-manager.js';
import { ShallowImportsBase, ShallowImports } from '#init/types.js';
import { SystemLogMediator } from '#logger/system-log-mediator.js';
import { GlobalProviders } from '#types/metadata-per-mod.js';
import { AnyObj, ModRefId } from '#types/mix.js';
import { NormalizedMeta } from '#types/normalized-meta.js';
import { ParamsTransferObj } from './feature-module.js';

type ObjectWithImports = { importsWithParams?: { modRefId: ModRefId }[] };

/**
 * Init hooks and metadata attached by additional decorators,
 * apart from the base decorators - `rootModule` or `featureModule`.
 */
export class InitHooksAndRawMeta<T extends ObjectWithImports = ObjectWithImports> {
  constructor(public rawMeta = {} as T) {}

  /**
   * Normalizes the metadata from the current decorator. It is then inserted into `baseMeta.normDecorMeta`.
   *
   * @param baseMeta Normalized metadata that is passed to the `featureModule` or `rootModule` decorator.
   */
  normalize(baseMeta: NormalizedMeta): ParamsTransferObj {
    return {};
  }

  /**
   * The returned array of `ModRefId` will be scanned by `ModuleManager`.
   *
   * @param meta Metadata returned by the `this.normalize()` method.
   */
  getModulesToScan(meta?: ParamsTransferObj): ModRefId[] {
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
