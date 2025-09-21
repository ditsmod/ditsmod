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
} from '@ditsmod/core';

import { TrpcModule } from '../trpc.module.js';
import { TrpcModuleNormalizer } from '#init/trpc-module-normalizer.js';
import {
  TrpcGlobalProviders,
  TrpcShallowImports,
  TrpcShallowModulesImporter,
} from '#init/trpc-shallow-modules-importer.js';
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

export const trpcRootModule: InitDecorator<TrpcInitRawMeta, TrpcModuleParams, TrpcInitMeta> = makeClassDecorator(
  transformMetadata,
  'trpcRootModule',
);
export const trpcModule: InitDecorator<TrpcInitRawMeta, TrpcModuleParams, TrpcInitMeta> = makeClassDecorator(
  transformMetadata,
  'trpcModule',
  trpcRootModule
);

export const initTrpcModule = trpcModule;

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

export function transformMetadata(data?: TrpcInitRawMeta): InitHooks<TrpcInitRawMeta> {
  const metadata = Object.assign({}, data);
  return new TrpcInitHooks(metadata);
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
}
