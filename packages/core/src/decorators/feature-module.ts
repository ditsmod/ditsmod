import { makeClassDecorator, Provider } from '#di';
import { ModuleMetadata, ModuleWithParams } from '#types/module-metadata.js';
import { AnyFn, AnyObj, AppMetadataMap, ModRefId, ModuleType } from '#types/mix.js';
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
 * An object with this interface must return `perModAttachedMetadata.normalize()`.
 */
export interface ParamsTransferObj<T extends AnyObj> {
  importsWithParams?: ({ modRefId: ModuleWithParams } & T)[];
}

export function transformModule(data?: ModuleMetadata): PerModAttachedMetadata<RawMeta> {
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
  return new PerModAttachedMetadata(rawMeta);
}
/**
 * A metadata attached to the `rootModule` or `featureModule` decorators.
 */
export class PerModAttachedMetadata<T extends AnyObj = AnyObj> {
  constructor(public metadata = {} as T) {}

  normalize?: (baseMeta: NormalizedMeta, metadata: T) => ParamsTransferObj<AnyObj> | undefined;
  /**
   * The returned array of modules will be scanned by `ModuleManager`.
   */
  addModulesToScan?(meta: AnyObj): ModRefId[];
  exportGlobalProviders?: (moduleManager: ModuleManager, baseMeta: NormalizedMeta, providersPerApp: Provider[]) => any;
  bootstrap?: (
    providersPerApp: Provider[],
    globalProviders: GlobalProviders,
    modRefId: ModRefId,
    moduleManager: ModuleManager,
    unfinishedScanModules: Set<ModRefId>,
  ) => Map<ModRefId, AnyObj>;
  importResolve?: (
    moduleManager: ModuleManager,
    appMetadataMap: AppMetadataMap,
    providersPerApp: Provider[],
    log: SystemLogMediator,
    errorMediator: SystemErrorMediator,
    metadataPerMod1?: AnyObj,
  ) => any;
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
