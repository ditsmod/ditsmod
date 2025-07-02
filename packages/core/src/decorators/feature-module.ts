import { makeClassDecorator, Provider } from '#di';
import { FeatureModuleWithParams, ModuleMetadata, ModuleWithParams } from '#types/module-metadata.js';
import { AnyFn, AnyObj, ModRefId, ModuleType, Override } from '#types/mix.js';
import { objectKeys } from '#utils/object-keys.js';
import { Providers } from '#utils/providers.js';
import { mergeArrays } from '#utils/merge-arrays.js';
import { CallsiteUtils } from '#utils/callsites.js';
import { ModuleManager } from '#init/module-manager.js';
import { GlobalProviders } from '#types/metadata-per-mod.js';
import { MetaAndImportsOrExports, NormalizedMeta } from '#types/normalized-meta.js';

export const featureModule: FeatureModuleDecorator = makeClassDecorator(transformModule);

export interface FeatureModuleDecorator {
  (data?: ModuleMetadata): any;
}

/**
 * This interface must be extended by interfaces that describe
 * the type of data passed to custom module decorators.
 */
export interface ParamsTransferObj<T extends AnyObj> {
  /**
   * An array of parameters intended for modules with parameters that are added to
   * the `imports` array in the `featureModule` or `rootModule` decorators.
   */
  params?: DecoratorParams<T>[];
}

/**
 * The interface intended for `ModuleWithParams`.
 */
export interface DecoratorParams<T extends AnyObj = AnyObj> {
  for: ModuleWithParams;
  data: T;
}

function mergeModuleWithParams(modWitParams: FeatureModuleWithParams, rawMeta: RawMeta) {
  if (modWitParams.id) {
    rawMeta.id = modWitParams.id;
  }
  objectKeys(modWitParams).forEach((p) => {
    // If here is object with [Symbol.iterator]() method, this transform it to an array.
    if (Array.isArray(modWitParams[p]) || modWitParams[p] instanceof Providers) {
      (rawMeta as any)[p] = mergeArrays((rawMeta as any)[p], modWitParams[p]);
    }
  });

  rawMeta.extensionsMeta = { ...rawMeta.extensionsMeta, ...modWitParams.extensionsMeta };
  return rawMeta;
}

export function transformModule(data?: ModuleMetadata): Override<AttachedMetadata, { metadata: RawMeta }> {
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
  return {
    isAttachedMetadata: true,
    metadata: rawMeta,
    mergeModuleWithParams: (modWithParams) => mergeModuleWithParams(modWithParams, rawMeta),
  };
}
/**
 * A metadata attached to the `rootModule` or `featureModule` decorators.
 */
export interface AttachedMetadata {
  isAttachedMetadata: true;
  metadata: AnyObj;
  mergeModuleWithParams?: (modWithParams: ModuleWithParams) => AnyObj;
  normalize?: (baseMeta: NormalizedMeta, metadata: AnyObj) => MetaAndImportsOrExports | undefined;
  exportGlobalProviders?: (moduleManager: ModuleManager, baseMeta: NormalizedMeta, providersPerApp: Provider[]) => any;
  bootstrap?: (
    providersPerApp: Provider[],
    globalProviders: GlobalProviders,
    modRefId: ModRefId,
    moduleManager: ModuleManager,
    unfinishedScanModules: Set<ModRefId>,
  ) => Map<ModRefId, AnyObj>;
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
