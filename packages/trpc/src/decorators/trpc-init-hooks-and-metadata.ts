import {
  makeClassDecorator,
  InitHooks,
  ModRefId,
  BaseMeta,
  InitDecorator,
  Provider,
  BaseInitRawMeta,
  FeatureModuleParams,
  Providers,
  ForwardRefFn,
  ModuleType,
  Class,
  BaseInitMeta,
  MultiProvider,
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
import { TrpcDeepModulesImporter } from '#init/trpc-deep-modules-importer.js';

export type TrpcModRefId = ModRefId;

class NormalizedParams {
  declare path?: string;
  declare absolutePath?: string;
  // guards: NormalizedGuard[] = [];
}

export class TrpcInitMeta extends BaseInitMeta {
  providersPerRou: Provider[] = [];
  providersPerReq: Provider[] = [];
  exportedProvidersPerRou: Provider[] = [];
  exportedProvidersPerReq: Provider[] = [];
  exportedMultiProvidersPerRou: MultiProvider[] = [];
  exportedMultiProvidersPerReq: MultiProvider[] = [];
  resolvedCollisionsPerRou: [any, ModRefId][] = [];
  resolvedCollisionsPerReq: [any, ModRefId][] = [];
  appendsModules: ModuleType[] = [];
  controllers: Class[] = [];
  params = new NormalizedParams();
}

export interface TrpcModuleParams extends FeatureModuleParams {
  providersPerRou?: Providers | Provider[];
  providersPerReq?: Providers | Provider[];
  /**
   * List of modules, `TrpcModuleParams` or tokens of providers exported by this
   * module.
   */
  exports?: any[];
  // guards?: GuardItem[];
}

/**
 * Metadata for the `initTrpcModule` decorator, which adds TRPC metadata to a `featureModule` or `rootModule`.
 */
export interface TrpcInitRawMeta extends BaseInitRawMeta<TrpcModuleParams> {
  /**
   * Providers per route.
   */
  providersPerRou?: Providers | (Provider | ForwardRefFn<Provider>)[];
  /**
   * Providers per HTTP request.
   */
  providersPerReq?: Providers | (Provider | ForwardRefFn<Provider>)[];
  /**
   * An array of pairs, each of which is in the first place the provider's token,
   * and in the second - the module from which to import the provider with the specified token.
   */
  resolvedCollisionsPerRou?: [any, ModRefId | ForwardRefFn<ModuleType>][];
  /**
   * An array of pairs, each of which is in the first place the provider's token,
   * and in the second - the module from which to import the provider with the specified token.
   */
  resolvedCollisionsPerReq?: [any, ModRefId | ForwardRefFn<ModuleType>][];
  /**
   * The application controllers.
   */
  controllers?: Class[];
}

/**
 * A decorator that adds tRPC metadata to a `featureModule` or `rootModule`.
 */
export const initTrpcModule: InitDecorator<TrpcInitRawMeta, TrpcModuleParams, TrpcInitMeta> =
  makeClassDecorator(transformMetadata);

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

  override importModulesDeep(config: DeepModulesImporterConfig) {
    return new TrpcDeepModulesImporter(config).importModulesDeep();
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
  providersPerApp: Provider[];
  globalProviders: GlobalProviders;
  modRefId: ModRefId;
  unfinishedScanModules: Set<ModRefId>;
  prefixPerMod: string;
  // guards1?: GuardPerMod1[];
  isAppends?: boolean;
}

export interface DeepModulesImporterConfig {
  parent: DeepModulesImporter;
  shallowImports: TrpcShallowImports;
  moduleManager: ModuleManager;
  shallowImportsMap: Map<ModRefId, ShallowImports>;
  providersPerApp: Provider[];
  log: SystemLogMediator;
}
