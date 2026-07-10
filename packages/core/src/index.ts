export * from './di.js';

export { PROVIDERS_PER_APP } from '#init/constants.js';
export { awaitTokens } from '#utils/await-tokens.js';
export { defaultProvidersPerMod } from '#init/default-providers-per-mod.js';
export { BaseAppInitializer } from '#init/base-app-initializer.js';
export { ShallowImports, BaseImportRegistry } from '#init/types.js';
export { BaseApplication } from '#init/base-application.js';
export { StandaloneApplication } from '#init/standalone-application.js';
export { BaseAppOptions } from '#init/base-app-options.js';
export { DeepModulesImporter } from '#init/deep-modules-importer.js';
export { AppProviders, AppInitHooks } from '#types/metadata-per-mod.js';
export { ShallowModulesImporter } from '#init/shallow-modules-importer.js';
export { defaultProvidersPerApp } from '#init/default-providers-per-app.js';
export { OnModuleInit } from '#init/hooks.js';
export { featureModule } from '#decorators/feature-module.js';
export {
  InitHooks,
  InitDecorator,
  InitMetaMap,
  InitParamsMap,
  AllInitHooks,
  InitDecoratorOptions,
} from '#decorators/init-hooks-and-metadata.js';
export { rootModule, RootDecoratorOptions } from '#decorators/root-module.js';
export {
  ExtensionCounters,
  ExtensionClass,
  ExtensionsMetaPerApp,
  Extension,
  ExtensionDebugMeta,
  ExtensionGroupMeta,
  PartialExtensionGroupMeta,
  ExtensionGroupMetaPerApp,
} from '#extension/extension-types.js';
export { topologicalSort } from './extension/topological-sort.js';
export { normalizeExtensionConfig } from './extension/extension-providers-and-configs.js';
export { isExtensionProvider, isExtensionConfig } from '#extension/type-guards.js';
export { ModuleInfo } from '#types/module-extract.js';
export { ExtensionStatistics } from '#extension/counter.js';
export { NormalizedModuleMeta, NormalizedInitMeta, getProxyForInitMeta } from '#init/base-meta.js';
export { ProvidersByLevel } from '#types/providers-metadata.js';
export { ConsoleLogger } from '#logger/console-logger.js';
export { ExtensionContext } from '#extension/extensions-context.js';
export { ExtensionManager, InternalExtensionManager } from '#extension/extension-manager.js';
export { LogMediator } from '#logger/log-mediator.js';
export { LogItem } from '#logger/types.js';
export { SystemLogMediator } from '#logger/system-log-mediator.js';
export { ModuleManager } from '#init/module-manager.js';
export { Logger, LoggerConfig, InputLogLevel, OutputLogLevel } from '#logger/logger.js';
export { ResolvedModuleMetadata } from '#types/metadata-per-mod.js';
export {
  AnyObj,
  HttpMethod,
  ModuleType,
  ResolvedGuard,
  ResolvedGuardPerMod,
  RequireProps,
  PickProps,
  RequireOnlyProps,
  OptionalProps,
  ModRefId,
  Override,
  UnionToIntersection,
} from '#types/mix.js';
export {
  ModuleDecoratorOptions,
  DynamicModule,
  DynamicModuleWithInit,
  DynamicModuleBase,
  DynamicModuleOptions,
} from '#decorators/module-decorator-options.js';
export { ProviderImport } from '#types/metadata-per-mod.js';
export { mergeArrays } from '#utils/merge-arrays.js';
export { getLastProviders } from '#utils/get-last-providers.js';
export { deepFreeze } from '#utils/deep-freeze.js';
export { getDuplicates } from '#utils/get-duplicates.js';
export { getCollisions } from '#utils/get-collisions.js';
export { getDependencies, ReflectiveDependency } from '#utils/get-dependencies.js';
export { getProviderName } from '#utils/get-provider-name.js';
export { ExtensionConfig, isOverrideExtensionConfig } from '#extension/extension-providers-and-configs.js';
export { getModule } from '#utils/get-module.js';
export { getStatusText, isSuccess, Status, STATUS_CODE_INFO } from '#utils/http-status-codes.js';
export { normalizeProviders } from '#utils/ng-utils.js';
export { pickProperties } from '#utils/pick-properties.js';
export { Providers } from '#utils/providers.js';
export { getDebugClassName, clearDebugClassNames } from '#utils/get-debug-class-name.js';
export { getProviderTarget, getProvidersTargets, getToken, getTokens } from '#utils/get-tokens.js';
export {
  isDynamicModule,
  isModuleWithInitHooks,
  isFeatureModule,
  isModDecor,
  isRootModule,
  isParamsWithDynamicModule,
  hasDeclaredInDir,
} from '#decorators/type-guards.js';
export { isProvider } from '#utils/type-guards.js';
export { objectKeys } from '#utils/object-keys.js';
export { Context } from '#ctx/context.js';
export { ctxProviders } from '#ctx/providers.js';
export { ctx } from '#ctx/decorators.js';
export { CtxModule } from '#ctx/ctx.module.js';
