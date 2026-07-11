import type {
  ModRefId,
  NormalizedModuleMeta,
  InitDecorator,
  Provider,
  InitDecoratorOptions,
  DynamicModuleOptions,
  ModuleType,
  Class,
  ModuleManager,
  AppProviders,
  DeepModulesImporter,
  ShallowModuleImports,
  SystemLogMediator,
  ForwardRefFn,
} from '@ditsmod/core';
import { Reflector, InitHooks, NormalizedInitMeta, AppInitHooks } from '@ditsmod/core';

import { TrpcModule } from '../trpc.module.js';
import { TrpcModuleNormalizer } from '#init/trpc-module-normalizer.js';
import { TrpcShallowModulesImporter } from '#init/trpc-shallow-modules-importer.js';
import type { GuardItem, ModuleScopedGuard, NormalizedGuard } from '#interceptors/trpc-guard.js';

export type TrpcModRefId = ModRefId;

class NormalizedParams {
  guards: NormalizedGuard[] = [];
}

export class TrpcInitMeta extends NormalizedInitMeta {
  appendsModules: ModuleType[] = [];
  controllers: Class[] = [];
  params = new NormalizedParams();
}

export interface TrpcModuleOptions extends DynamicModuleOptions {
  guards?: GuardItem[];
}

/**
 * Metadata for the `initTrpcModule` decorator, which adds TRPC metadata to a `featureModule` or `rootModule`.
 */
export interface TrpcInitDecoratorOptions extends InitDecoratorOptions<TrpcModuleOptions> {
  /**
   * The application controllers.
   */
  controllers?: Class[];
}

export const initTrpcModule: InitDecorator<TrpcInitDecoratorOptions, TrpcModuleOptions, TrpcInitMeta> =
  Reflector.makeClassDecorator(transformInitMeta, 'initTrpcModule');
export const trpcRootModule: InitDecorator<
  TrpcInitDecoratorOptions & { resolvedCollisionPerApp?: [any, ModRefId | ForwardRefFn<ModuleType>][] },
  TrpcModuleOptions,
  TrpcInitMeta
> = Reflector.makeClassDecorator(transformRootMetadata, 'trpcRootModule', initTrpcModule);
export const trpcModule: InitDecorator<TrpcInitDecoratorOptions, TrpcModuleOptions, TrpcInitMeta> =
  Reflector.makeClassDecorator(transformFeatureMetadata, 'trpcModule', initTrpcModule);

export function transformInitMeta(data?: TrpcInitDecoratorOptions): InitHooks<TrpcInitDecoratorOptions> {
  const metadata = Object.assign({}, data);
  return new TrpcInitHooks(metadata);
}
export function transformRootMetadata(data?: TrpcInitDecoratorOptions): InitHooks<TrpcInitDecoratorOptions> {
  const metadata = Object.assign({}, data);
  const initHooks = new TrpcInitHooks(metadata);
  initHooks.moduleRole = 'root';
  return initHooks;
}
export function transformFeatureMetadata(data?: TrpcInitDecoratorOptions): InitHooks<TrpcInitDecoratorOptions> {
  const metadata = transformRootMetadata(data);
  metadata.moduleRole = 'feature';
  return metadata;
}

export class TrpcInitHooks extends InitHooks<TrpcInitDecoratorOptions> {
  override hostModule = TrpcModule;

  override normalize(normalizedModuleMeta: NormalizedModuleMeta): TrpcInitMeta {
    return new TrpcModuleNormalizer().normalize(normalizedModuleMeta, this.decoratorOptions);
  }

  override getModulesToScan(meta?: TrpcInitMeta): TrpcModRefId[] {
    return [];
  }

  override exportAppProviders(config: ExportAppProvidersConfig): TrpcAppProviders {
    return new TrpcShallowModulesImporter().exportAppProviders(config);
  }

  override importModulesShallow(config: ImportModulesShallowConfig): Map<ModRefId, TrpcShallowModuleImports> {
    return new TrpcShallowModulesImporter().importModulesShallow(config);
  }

  override getProvidersToOverride(meta: TrpcInitMeta): Provider[][] {
    return [meta.providersPerRou, meta.providersPerReq];
  }
}

export interface ExportAppProvidersConfig {
  moduleManager: ModuleManager;
  appProviders: AppProviders;
  normalizedModuleMeta: NormalizedModuleMeta;
}

export interface ImportModulesShallowConfig {
  moduleManager: ModuleManager;
  appProviders: AppProviders;
  modRefId: ModRefId;
  unfinishedScanModules: Set<ModRefId>;
  guards1?: ModuleScopedGuard[];
}

export interface DeepModulesImporterConfig {
  parent: DeepModulesImporter;
  shallowModuleImports: TrpcShallowModuleImports;
  moduleManager: ModuleManager;
  shallowModuleImportsMap: Map<ModRefId, ShallowModuleImports>;
  providersPerApp: Provider[];
  log: SystemLogMediator;
} /**
 * Metadata collected using `ShallowModulesImporter`. The target for this metadata is `DeepModulesImporter`.
 */

export class TrpcShallowModuleImports {
  normalizedModuleMeta: NormalizedModuleMeta;
  guards1: ModuleScopedGuard[];
  /**
   * Snapshot of `TrpcInitMeta`. If you modify any array in this object,
   * the original array will remain unchanged.
   */
  meta: TrpcInitMeta;
}

export class TrpcAppProviders extends AppInitHooks {}
