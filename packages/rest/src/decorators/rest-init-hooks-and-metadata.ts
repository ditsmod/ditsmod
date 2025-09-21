import { makeClassDecorator, InitHooks, ModRefId, BaseMeta, InitDecorator, Provider } from '@ditsmod/core';

import { RestInitRawMeta, RestModuleParams } from '#init/rest-init-raw-meta.js';
import { RestModuleNormalizer } from '#init/rest-module-normalizer.js';
import { RestShallowModulesImporter } from '#init/rest-shallow-modules-importer.js';
import {
  DeepModulesImporterConfig,
  ExportGlobalProvidersConfig,
  ImportModulesShallowConfig,
  RestShallowImports,
} from '#init/types.js';
import { RestModRefId, RestInitMeta } from '#init/rest-init-meta.js';
import { RestGlobalProviders } from '#types/types.js';
import { RestModule } from '#init/rest.module.js';
import { RestDeepModulesImporter } from '#init/rest-deep-modules-importer.js';

export const restRootModule: InitDecorator<RestInitRawMeta, RestModuleParams, RestInitMeta> = makeClassDecorator(
  transformRootMeta,
  'restRootModule',
);
export const restModule: InitDecorator<RestInitRawMeta, RestModuleParams, RestInitMeta> = makeClassDecorator(
  transformFeatureMeta,
  'restModule',
  restRootModule,
);

export const initRest = restRootModule;

export class RestInitHooks extends InitHooks<RestInitRawMeta> {
  override hostModule = RestModule;

  override normalize(baseMeta: BaseMeta): RestInitMeta {
    return new RestModuleNormalizer().normalize(baseMeta, this.rawMeta);
  }

  override getModulesToScan(meta?: RestInitMeta): RestModRefId[] {
    return meta?.appendsModules.concat(meta?.appendsWithParams as any[]) || [];
  }

  override exportGlobalProviders(config: ExportGlobalProvidersConfig): RestGlobalProviders {
    return new RestShallowModulesImporter().exportGlobalProviders(config);
  }

  override importModulesShallow(config: ImportModulesShallowConfig): Map<ModRefId, RestShallowImports> {
    return new RestShallowModulesImporter().importModulesShallow(config);
  }

  override importModulesDeep(config: DeepModulesImporterConfig) {
    return new RestDeepModulesImporter(config).importModulesDeep();
  }

  override getProvidersToOverride(meta: RestInitMeta): Provider[][] {
    return [meta.providersPerRou, meta.providersPerReq];
  }
}

export function transformRootMeta(data?: RestInitRawMeta): InitHooks<RestInitRawMeta> {
  const metadata = Object.assign({}, data);
  const initHooks = new RestInitHooks(metadata);
  initHooks.moduleRole = 'root';
  return initHooks;
}

export function transformFeatureMeta(data?: RestInitRawMeta): InitHooks<RestInitRawMeta> {
  const metadata = transformRootMeta(data);
  metadata.moduleRole = 'feature';
  return metadata;
}
