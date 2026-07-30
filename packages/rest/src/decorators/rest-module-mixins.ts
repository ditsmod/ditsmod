import type { ModRefId, NormalizedModuleMeta, MixinDecorator, Provider, ForwardRefFn, StaticModule } from '@ditsmod/core';
import { Reflector, ModuleMixin } from '@ditsmod/core';

import type { RestMixinOptions, RestModuleOptions } from '#init/rest-mixin-raw-meta.js';
import { RestModuleNormalizer } from '#init/rest-module-normalizer.js';
import { RestShallowModulesImporter } from '#init/rest-shallow-modules-importer.js';
import type {
  DeepModulesImporterConfig,
  ExportAppProvidersConfig,
  ImportModulesShallowConfig,
  RestShallowModuleImports,
} from '#init/types.js';
import type { RestModRefId, RestMixinMeta } from '#init/rest-mixin-meta.js';
import type { RestAppProviders } from '#types/types.js';
import { RestModule } from '#init/rest.module.js';
import { RestDeepModulesImporter } from '#init/rest-deep-modules-importer.js';

export const mixinRest: MixinDecorator<RestMixinOptions, RestModuleOptions, RestMixinMeta> = Reflector.makeClassDecorator(
  transformMixinMeta,
  'mixinRest',
);
export const restRootModule: MixinDecorator<
  RestMixinOptions & { resolvedCollisionsPerApp?: [any, ModRefId | ForwardRefFn<StaticModule>][] },
  RestModuleOptions,
  RestMixinMeta
> = Reflector.makeClassDecorator(transformRootMeta, 'restRootModule', mixinRest);
export const restModule: MixinDecorator<RestMixinOptions, RestModuleOptions, RestMixinMeta> = Reflector.makeClassDecorator(
  transformFeatureMeta,
  'restModule',
  mixinRest,
);

export function transformMixinMeta(data?: RestMixinOptions): ModuleMixin<RestMixinOptions> {
  const metadata = Object.assign({}, data);
  return new RestModuleMixin(metadata);
}
export function transformRootMeta(data?: RestMixinOptions): ModuleMixin<RestMixinOptions> {
  const metadata = Object.assign({}, data);
  const moduleMixin = new RestModuleMixin(metadata);
  moduleMixin.moduleRole = 'root';
  return moduleMixin;
}
export function transformFeatureMeta(data?: RestMixinOptions): ModuleMixin<RestMixinOptions> {
  const metadata = transformRootMeta(data);
  metadata.moduleRole = 'feature';
  return metadata;
}

export class RestModuleMixin extends ModuleMixin<RestMixinOptions> {
  override hostModule = RestModule;

  override normalize(normalizedModuleMeta: NormalizedModuleMeta): RestMixinMeta {
    return new RestModuleNormalizer().normalize(normalizedModuleMeta, this.moduleOptions);
  }

  override getModulesToScan(meta?: RestMixinMeta): RestModRefId[] {
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

  override getProvidersToOverride(meta: RestMixinMeta): Provider[][] {
    return [meta.providersPerRou, meta.providersPerReq];
  }
}
