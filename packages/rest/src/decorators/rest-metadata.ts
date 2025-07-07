import {
  makeClassDecorator,
  InitHooksAndMetadata,
  ModuleManager,
  Provider,
  GlobalProviders,
  ModRefId,
  NormalizedMeta,
  SystemErrorMediator,
  SystemLogMediator,
  AnyObj,
  AppMetadataMap,
} from '@ditsmod/core';

import { AddRest } from '#module/module-metadata.js';
import { AddRestNormalizer } from '#module/rest-metadata-normalizer.js';
import { RestShallowProvidersCollector } from '#module/rest-module-factory.js';
import { RestNormalizedMeta } from '#types/rest-normalized-meta.js';
import { RestDeepProvidersCollector } from '#module/rest-imports-resolver.js';
/**
 * A decorator that adds REST metadata to a `featureModule` or `rootModule`.
 */
export const addRest: AddRestDecorator = makeClassDecorator(transformMetadata);

export interface AddRestDecorator {
  (data?: AddRest): any;
}

class RestInitHooksAndMetadata extends InitHooksAndMetadata<AddRest> {
  override normalize(baseMeta: NormalizedMeta, metadataWithParams: AddRest) {
    return new AddRestNormalizer().normalize(baseMeta, metadataWithParams);
  }

  override addModulesToScan(meta: RestNormalizedMeta) {
    return meta.appendsModules.concat(meta.appendsWithParams as any[]);
  }

  override exportGlobalProviders(moduleManager: ModuleManager, baseMeta: NormalizedMeta) {
    return new RestShallowProvidersCollector().exportGlobalProviders(moduleManager, baseMeta);
  }

  override bootstrap(
    ...args: [
      globalProviders: GlobalProviders,
      modRefId: ModRefId,
      moduleManager: ModuleManager,
      unfinishedScanModules: Set<ModRefId>,
    ]
  ) {
    return new RestShallowProvidersCollector().bootstrap(...args);
  }

  override importResolve(
    moduleManager: ModuleManager,
    appMetadataMap: AppMetadataMap,
    providersPerApp: Provider[],
    log: SystemLogMediator,
    errorMediator: SystemErrorMediator,
    addRestPerMod1?: AnyObj,
  ) {
    const impResolver = new RestDeepProvidersCollector(
      moduleManager,
      appMetadataMap,
      providersPerApp,
      log,
      errorMediator,
      addRestPerMod1 as any,
    );
    return impResolver.resolve();
  }
}

export function transformMetadata(data?: AddRest): InitHooksAndMetadata<AddRest> {
  const metadata = Object.assign({}, data);
  return new RestInitHooksAndMetadata(metadata);
}
