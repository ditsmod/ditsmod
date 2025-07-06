import {
  makeClassDecorator,
  AttachedMetadata,
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

import { RestMetadata } from '#module/module-metadata.js';
import { RestMetadataNormalizer } from '#module/rest-metadata-normalizer.js';
import { RestMetadataPerMod1, RestModuleFactory } from '#module/rest-module-factory.js';
import { RestNormalizedMeta } from '#types/rest-normalized-meta.js';
import { RestImportsResolver } from '#module/rest-imports-resolver.js';

export const restMetadata: RestMetadataDecorator = makeClassDecorator(transformMetadata);

export interface RestMetadataDecorator {
  (data?: RestMetadata): any;
}

export function transformMetadata(data?: RestMetadata): AttachedMetadata {
  const metadata = Object.assign({}, data);
  return {
    isAttachedMetadata: true,
    metadata,
    normalize(baseMeta: NormalizedMeta, metadataWithParams: RestMetadata) {
      return new RestMetadataNormalizer().normalize(baseMeta, metadataWithParams);
    },
    addModulesToScan(meta: RestNormalizedMeta) {
      return meta.appendsModules.concat(meta.appendsWithParams as any[]);
    },
    exportGlobalProviders(moduleManager: ModuleManager, baseMeta: NormalizedMeta, providersPerApp: Provider[]) {
      return new RestModuleFactory().exportGlobalProviders(moduleManager, baseMeta, providersPerApp);
    },
    bootstrap(
      ...args: [
        providersPerApp: Provider[],
        globalProviders: GlobalProviders,
        modRefId: ModRefId,
        moduleManager: ModuleManager,
        unfinishedScanModules: Set<ModRefId>,
      ]
    ) {
      return new RestModuleFactory().bootstrap(...args);
    },
    importResolve(
      moduleManager: ModuleManager,
      appMetadataMap: AppMetadataMap,
      providersPerApp: Provider[],
      log: SystemLogMediator,
      errorMediator: SystemErrorMediator,
      restMetadataPerMod1?: AnyObj,
    ) {
      const impResolver = new RestImportsResolver(
        moduleManager,
        appMetadataMap,
        providersPerApp,
        log,
        errorMediator,
        restMetadataPerMod1 as any,
      );
      return impResolver.resolve();
    },
  };
}
