import { makeClassDecorator, Provider } from '#di';
import { ModuleMetadata, ModuleWithParams, ModuleWithParentMeta } from '#types/module-metadata.js';
import { AnyFn, AnyObj, ModRefId, ModuleType, Override } from '#types/mix.js';
import { ShallowImports, ShallowImportsBase } from '#init/types.js';
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
export interface ParamsTransferObj<T extends { modRefId: ModRefId } = { modRefId: ModRefId }> {
  importsWithParams?: Override<T, { modRefId: ModuleWithParentMeta }>[];
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
 * Init hooks and metadata attached by additional decorators,
 * apart from the base decorators - `rootModule` or `featureModule`.
 */
export class InitHooksAndMetadata<T extends AnyObj> {
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
