/**
 * Extension Development Kit.
 */

export { ModuleManager } from './services/module-manager';
export { PreRoutes } from './extensions/pre-routes';
export { ModuleFactory } from './module-factory';
export { ProvidersMetadata } from './models/providers-metadata';
export { ControllerMetadata } from './decorators/controller';
export * from './utils/type-guards';
export { deepFreeze } from './utils/deep-freeze';
export { isModule } from './utils/type-guards';
export { pickProperties } from './utils/pick-properties';
export { ExtensionMetadata } from './types/extension-metadata';
export { ControllerType, ModuleType, AnyObj, NormalizedGuard, DecoratorMetadata } from './types/mix';
export { PreRouteMeta } from './types/route-data';
export { Extension, ROUTES_EXTENSIONS, DEFAULT_EXTENSIONS } from './types/extension';
export { ModuleMetadata } from './types/module-metadata';
export { RouteData } from './types/route-data';
export { AppInitializer } from './services/app-initializer';
export { ExtensionsManager } from './services/extensions-manager';
export { RouteMetadata } from './decorators/route';
export { AppMetadataMap, APP_METADATA_MAP } from './types/app-metadata-map';
