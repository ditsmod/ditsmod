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
import type { RestModRefId, RestInitMeta } from '#init/rest-mixin-meta.js';
import type { RestAppProviders } from '#types/types.js';
import { RestModule } from '#init/rest.module.js';
import { RestDeepModulesImporter } from '#init/rest-deep-modules-importer.js';

export const mixinRest: MixinDecorator<RestMixinOptions, RestModuleOptions, RestInitMeta> =
  Reflector.makeClassDecorator(transformInitMeta, 'mixinRest');
export const restRootModule: MixinDecorator<
  RestMixinOptions & { resolvedCollisionsPerApp?: [any, ModRefId | ForwardRefFn<StaticModule>][] },
  RestModuleOptions,
  RestInitMeta
> = Reflector.makeClassDecorator(transformRootMeta, 'restRootModule', mixinRest);
export const restModule: MixinDecorator<RestMixinOptions, RestModuleOptions, RestInitMeta> =
  Reflector.makeClassDecorator(transformFeatureMeta, 'restModule', mixinRest);

export function transformInitMeta(data?: RestMixinOptions): ModuleMixin<RestMixinOptions> {
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

  override normalize(normalizedModuleMeta: NormalizedModuleMeta): RestInitMeta {
    return new RestModuleNormalizer().normalize(normalizedModuleMeta, this.moduleOptions);
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
