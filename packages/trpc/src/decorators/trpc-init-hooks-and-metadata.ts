import {
  makeClassDecorator,
  InitHooks,
  ModRefId,
  BaseMeta,
  InitDecorator,
  Provider,
  BaseInitRawMeta,
  FeatureModuleParams,
  ModuleType,
  Class,
  BaseInitMeta,
  ModuleManager,
  GlobalProviders,
  DeepModulesImporter,
  ShallowImports,
  SystemLogMediator,
  GlobalInitHooks,
  ForwardRefFn,
} from '@ditsmod/core';

import { TrpcModule } from '../trpc.module.js';
import { TrpcModuleNormalizer } from '#init/trpc-module-normalizer.js';
import { TrpcShallowModulesImporter } from '#init/trpc-shallow-modules-importer.js';
import { GuardItem, GuardPerMod1, NormalizedGuard } from '#interceptors/trpc-guard.js';

export type TrpcModRefId = ModRefId;

class NormalizedParams {
  guards: NormalizedGuard[] = [];
}

export class TrpcInitMeta extends BaseInitMeta {
  appendsModules: ModuleType[] = [];
  controllers: Class[] = [];
  params = new NormalizedParams();
}

export interface TrpcModuleParams extends FeatureModuleParams {
  guards?: GuardItem[];
}

/**
 * Metadata for the `initTrpcModule` decorator, which adds TRPC metadata to a `featureModule` or `rootModule`.
 */
export interface TrpcInitRawMeta extends BaseInitRawMeta<TrpcModuleParams> {
  /**
   * The application controllers.
   */
  controllers?: Class[];
}

export const initTrpcModule: InitDecorator<TrpcInitRawMeta, TrpcModuleParams, TrpcInitMeta> = makeClassDecorator(
  transformInitMeta,
  'initTrpcModule',
);
export const trpcRootModule: InitDecorator<
  TrpcInitRawMeta & { resolvedCollisionsPerApp?: [any, ModRefId | ForwardRefFn<ModuleType>][] },
  TrpcModuleParams,
  TrpcInitMeta
> = makeClassDecorator(transformRootMetadata, 'trpcRootModule', initTrpcModule);
export const trpcModule: InitDecorator<TrpcInitRawMeta, TrpcModuleParams, TrpcInitMeta> = makeClassDecorator(
  transformFeatureMetadata,
  'trpcModule',
  initTrpcModule,
);

export function transformInitMeta(data?: TrpcInitRawMeta): InitHooks<TrpcInitRawMeta> {
  const metadata = Object.assign({}, data);
  return new TrpcInitHooks(metadata);
}
export function transformRootMetadata(data?: TrpcInitRawMeta): InitHooks<TrpcInitRawMeta> {
  const metadata = Object.assign({}, data);
  const initHooks = new TrpcInitHooks(metadata);
  initHooks.moduleRole = 'root';
  return initHooks;
}
export function transformFeatureMetadata(data?: TrpcInitRawMeta): InitHooks<TrpcInitRawMeta> {
  const metadata = transformRootMetadata(data);
  metadata.moduleRole = 'feature';
  return metadata;
}

export class TrpcInitHooks extends InitHooks<TrpcInitRawMeta> {
  override hostModule = TrpcModule;

  override normalize(baseMeta: BaseMeta): TrpcInitMeta {
    return new TrpcModuleNormalizer().normalize(baseMeta, this.rawMeta);
  }

  override getModulesToScan(meta?: TrpcInitMeta): TrpcModRefId[] {
    return [];
  }

  override exportGlobalProviders(config: ExportGlobalProvidersConfig): TrpcGlobalProviders {
    return new TrpcShallowModulesImporter().exportGlobalProviders(config);
  }

  override importModulesShallow(config: ImportModulesShallowConfig): Map<ModRefId, TrpcShallowImports> {
    return new TrpcShallowModulesImporter().importModulesShallow(config);
  }

  override getProvidersToOverride(meta: TrpcInitMeta): Provider[][] {
    return [meta.providersPerRou, meta.providersPerReq];
  }
}

export interface ExportGlobalProvidersConfig {
  moduleManager: ModuleManager;
  globalProviders: GlobalProviders;
  baseMeta: BaseMeta;
}

export interface ImportModulesShallowConfig {
  moduleManager: ModuleManager;
  globalProviders: GlobalProviders;
  modRefId: ModRefId;
  unfinishedScanModules: Set<ModRefId>;
  guards1?: GuardPerMod1[];
}

export interface DeepModulesImporterConfig {
  parent: DeepModulesImporter;
  shallowImports: TrpcShallowImports;
  moduleManager: ModuleManager;
  shallowImportsMap: Map<ModRefId, ShallowImports>;
  providersPerApp: Provider[];
  log: SystemLogMediator;
} /**
 * Metadata collected using `ShallowModulesImporter`. The target for this metadata is `DeepModulesImporter`.
 */

export class TrpcShallowImports {
  baseMeta: BaseMeta;
  guards1: GuardPerMod1[];
  /**
   * Snapshot of `TrpcInitMeta`. If you modify any array in this object,
   * the original array will remain unchanged.
   */
  meta: TrpcInitMeta;
}

export class TrpcGlobalProviders extends GlobalInitHooks {}
