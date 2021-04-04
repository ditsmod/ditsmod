/**
 * Extension Development Kit.
 */

export { ModuleManager } from './services/module-manager';
export { PreRoutes} from './services/pre-routes';
export { ModuleFactory } from './module-factory';
export { ProvidersMetadata } from './models/providers-metadata';
export { ControllerMetadata } from './decorators/controller';
export * from './utils/type-guards';
export { deepFreeze } from './utils/deep-freeze';
export { isModule } from './utils/type-guards';
export { pickProperties } from './utils/pick-properties';
export { ExtensionMetadata } from './types/extension-metadata';
export { ControllerType } from './types/controller-type';
export { ModuleType } from './types/module-type';
export { AnyObj } from './types/any-obj';
export { NormalizedGuard } from './types/normalized-guard';
export { Extension, ROUTES_EXTENSIONS, DEFAULT_EXTENSIONS } from './types/extension';
export { ModuleMetadata } from './types/module-metadata';
export { RouteData } from './types/route-data';
export { AppInitializer } from './services/app-initializer';
export { ExtensionsMap } from './types/extensions-map';
export { RouteMetadata } from './decorators/route';
export { DecoratorMetadata } from './types/decorator-metadata';
export { EXTENSIONS_MAP } from './types/extensions-map';
