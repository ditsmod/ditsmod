import { NormalizedModuleMetadata } from '../models/normalized-module-metadata';
import { ControllerAndMethodMetadata } from './controller-and-method-metadata';
import { HttpMethod, ImportedProviders, ModuleType, ModuleWithParams, NormalizedGuard, ServiceProvider } from './mix';

export class ImportsMap {
  importedPerMod = new Map<ServiceProvider, ModuleType | ModuleWithParams>();
  importedPerRou = new Map<ServiceProvider, ModuleType | ModuleWithParams>();
  importedPerReq = new Map<ServiceProvider, ModuleType | ModuleWithParams>();
}

/**
 * Metadata collected using `ModuleFactory`.
 */
export class MetadataPerMod1 {
  prefixPerMod: string;
  guardsPerMod: NormalizedGuard[];
  meta: NormalizedModuleMetadata;
  /**
   * The controller metadata collected from all controllers of current module.
   */
  controllersMetadata: ControllerAndMethodMetadata[];
  /**
   * Map between a module and its ImportedProviders.
   */
  importedProvidersMap: Map<ModuleType | ModuleWithParams, ImportedProviders>;
}

/**
 * This metadata is generated by `ROUTES_EXTENSIONS` group, and available for other extensions
 * that need set routes.
 */
 export class MetadataPerMod2 {
  module: ModuleType | ModuleWithParams;
  moduleName: string;
  /**
   * Providers per a module.
   */
  providersPerMod: ServiceProvider[];
  /**
   * Providers per a route.
   */
  providersPerRou: ServiceProvider[];
  /**
   * Providers per a request.
   */
  providersPerReq: ServiceProvider[];
  metaForExtensionsPerRouArr: MetaForExtensionsPerRou[];
}

export class MetaForExtensionsPerRou {
  /**
   * Providers per a route.
   */
  providersPerRou: ServiceProvider[];
  /**
   * Providers per a request.
   */
  providersPerReq: ServiceProvider[];
  path: string;
  httpMethod: HttpMethod;
}
