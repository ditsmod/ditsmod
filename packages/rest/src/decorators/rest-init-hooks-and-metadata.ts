import type { ModRefId, NormalizedModuleMeta, InitDecorator, Provider, ForwardRefFn, ModuleType } from '@ditsmod/core';
import { Reflector, InitHooks } from '@ditsmod/core';

import type { RestInitDecoratorOptions, RestModuleOptions } from '#init/rest-init-raw-meta.js';
import { RestModuleNormalizer } from '#init/rest-module-normalizer.js';
import { RestShallowModulesImporter } from '#init/rest-shallow-modules-importer.js';
import type {
  DeepModulesImporterConfig,
  ExportAppProvidersConfig,
  ImportModulesShallowConfig,
  RestShallowModuleImports,
} from '#init/types.js';
import type { RestModRefId, RestInitMeta } from '#init/rest-init-meta.js';
import type { RestAppProviders } from '#types/types.js';
import { RestModule } from '#init/rest.module.js';
import { RestDeepModulesImporter } from '#init/rest-deep-modules-importer.js';

export const initRest: InitDecorator<RestInitDecoratorOptions, RestModuleOptions, RestInitMeta> =
  Reflector.makeClassDecorator(transformInitMeta, 'initRest');
export const restRootModule: InitDecorator<
  RestInitDecoratorOptions & { resolvedCollisionsPerApp?: [any, ModRefId | ForwardRefFn<ModuleType>][] },
  RestModuleOptions,
  RestInitMeta
> = Reflector.makeClassDecorator(transformRootMeta, 'restRootModule', initRest);
export const restModule: InitDecorator<RestInitDecoratorOptions, RestModuleOptions, RestInitMeta> =
  Reflector.makeClassDecorator(transformFeatureMeta, 'restModule', initRest);

export function transformInitMeta(data?: RestInitDecoratorOptions): InitHooks<RestInitDecoratorOptions> {
  const metadata = Object.assign({}, data);
  return new RestInitHooks(metadata);
}
export function transformRootMeta(data?: RestInitDecoratorOptions): InitHooks<RestInitDecoratorOptions> {
  const metadata = Object.assign({}, data);
  const initHooks = new RestInitHooks(metadata);
  initHooks.moduleRole = 'root';
  return initHooks;
}
export function transformFeatureMeta(data?: RestInitDecoratorOptions): InitHooks<RestInitDecoratorOptions> {
  const metadata = transformRootMeta(data);
  metadata.moduleRole = 'feature';
  return metadata;
}

export class RestInitHooks extends InitHooks<RestInitDecoratorOptions> {
  override hostModule = RestModule;

  override normalize(normalizedModuleMeta: NormalizedModuleMeta): RestInitMeta {
    return new RestModuleNormalizer().normalize(normalizedModuleMeta, this.decoratorOptions);
  }

  override getModulesToScan(meta?: RestInitMeta): RestModRefId[] {
    return meta?.appendsModules.concat(meta?.appendsWithOpts as any[]) || [];
  }

  override exportAppProviders(config: ExportAppProvidersConfig): RestAppProviders {
    return new RestShallowModulesImporter().exportAppProviders(config);
  }

  override importModulesShallow(config: ImportModulesShallowConfig): Map<ModRefId, RestShallowModuleImports> {
    return new RestShallowModulesImporter().importModulesShallow(config);
  }

  override importModulesDeep(config: DeepModulesImporterConfig) {
    return new RestDeepModulesImporter(config).importModulesDeep();
  }

  override getProvidersToOverride(meta: RestInitMeta): Provider[][] {
    return [meta.providersPerRou, meta.providersPerReq];
  }
}
