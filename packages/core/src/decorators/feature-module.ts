import { makeClassDecorator, Provider } from '#di';
import { ModuleMetadata, ModuleWithParams } from '#types/module-metadata.js';
import { AnyFn, AnyObj, ModRefId, ModuleType } from '#types/mix.js';
import { ShallowImportsBase } from '#init/types.js';
import { objectKeys } from '#utils/object-keys.js';
import { Providers } from '#utils/providers.js';
import { CallsiteUtils } from '#utils/callsites.js';
import { ModuleManager } from '#init/module-manager.js';
import { GlobalProviders } from '#types/metadata-per-mod.js';
import { NormalizedMeta } from '#types/normalized-meta.js';
import { SystemLogMediator } from '#logger/system-log-mediator.js';
import { SystemErrorMediator } from '#error/system-error-mediator.js';

export const featureModule: FeatureModuleDecorator = makeClassDecorator(transformModule);

export interface FeatureModuleDecorator {
  (data?: ModuleMetadata): any;
}
/**
 * An object with this interface must return `initHooksAndMetadata.normalize()`.
 */
export interface ParamsTransferObj<T extends AnyObj> {
  importsWithParams?: ({ modRefId: ModuleWithParams } & T)[];
}

export function transformModule(data?: ModuleMetadata): InitHooksAndMetadata<RawMeta> {
  const rawMeta = Object.assign({}, data) as RawMeta;
  objectKeys(rawMeta).forEach((p) => {
    if (rawMeta[p] instanceof Providers) {
      (rawMeta as any)[p] = [...rawMeta[p]];
    } else if (Array.isArray(rawMeta[p])) {
      (rawMeta as any)[p] = rawMeta[p].slice();
    }
  });

  rawMeta.decorator = featureModule;
  rawMeta.declaredInDir = CallsiteUtils.getCallerDir() || '.';
  return new InitHooksAndMetadata(rawMeta);
}
/**
 * Init hooks and metadata attached to the `rootModule` or `featureModule` decorators.
 */
export class InitHooksAndMetadata<T extends AnyObj> {
  constructor(public metadata = {} as T) {}

  normalize(baseMeta: NormalizedMeta, metadata: T): ParamsTransferObj<AnyObj> | undefined {
    return;
  }

  /**
   * The returned array of modules will be scanned by `ModuleManager`.
   */
  getModulesToScan(meta?: AnyObj): ModRefId[] {
    return [];
  }

  exportGlobalProviders(moduleManager: ModuleManager, baseMeta: NormalizedMeta): any {
    return;
  }

  /**
   * Recursively collects providers taking into account module imports/exports,
   * but does not take provider dependencies into account.
   */
  importModulesShallow(
    shallowImportsBase: ShallowImportsBase,
    providersPerApp: Provider[],
    globalProviders: GlobalProviders,
    modRefId: ModRefId,
    unfinishedScanModules: Set<ModRefId>,
  ): Map<ModRefId, { baseMeta: NormalizedMeta } & AnyObj> {
    return new Map();
  }

  /**
   * By analyzing the dependencies of the providers returned by `ShallowModulesImporter`,
   * recursively collects providers for them from the corresponding modules.
   */
  importModulesDeep(
    metadataPerMod1: { baseMeta: NormalizedMeta } & AnyObj,
    moduleManager: ModuleManager,
    shallowImportsBase: ShallowImportsBase,
    providersPerApp: Provider[],
    log: SystemLogMediator,
    errorMediator: SystemErrorMediator,
  ): any {
    return;
  }
}

/**
 * Raw module metadata returned by reflector.
 */
export interface RawMeta extends ModuleMetadata {
  decorator: AnyFn;
  declaredInDir: string;
  /**
   * An array of pairs, each of which is in the first place the provider's token,
   * and in the second - the module from which to import the provider with the specified token.
   */
  resolvedCollisionsPerApp?: [any, ModuleType | ModuleWithParams][];
}
