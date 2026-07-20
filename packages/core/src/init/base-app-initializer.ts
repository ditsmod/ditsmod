import { DeepModulesImporter } from '#init/deep-modules-importer.js';
import { LogMediator } from '#logger/log-mediator.js';
import type { PublicLogMediator } from '#logger/system-log-mediator.js';
import { SystemLogMediator } from '#logger/system-log-mediator.js';
import type { NormalizedModuleMeta } from '#init/normalized-meta.js';
import { BaseAppOptions } from '#init/base-app-options.js';
import { ShallowModulesImporter } from '#init/shallow-modules-importer.js';
import { ExtensionStatistics } from '#extension/counter.js';
import { defaultProvidersPerApp } from './default-providers-per-app.js';
import { ExtensionContext } from '#extension/extensions-context.js';
import { ExtensionManager, InternalExtensionManager } from '#extension/extension-manager.js';
import { ModuleManager } from '#init/module-manager.js';
import type { ModRefId } from '#types/mix.js';
import type { Provider } from '#di/top/types-and-models.js';
import type { ExtensionClass } from '#extension/extension-types.js';
import { ExtensionCounters } from '#extension/extension-types.js';
import { getCollisions } from '#utils/get-collisions.js';
import { getDuplicates } from '#utils/get-duplicates.js';
import { getLastProviders } from '#utils/get-last-providers.js';
import { getProvidersTargets, getToken, getTokens } from '#utils/get-tokens.js';
import { normalizeProviders } from '#utils/ng-utils.js';
import { ResolvedModuleMeta } from '#types/metadata-per-mod.js';
import { getProviderName } from '#utils/get-provider-name.js';
import { getModule } from '#utils/get-module.js';
import { getDebugClassName } from '#utils/get-debug-class-name.js';
import type { ShallowModuleImports } from './types.js';
import type { ProvidersByLevel } from '#types/providers-metadata.js';
import {
  MetadataCollectionFailure,
  ModuleInjectorCreationFailure,
  Stage2InitFailure,
  Stage3InitFailure,
  ModuleNotImported,
  AppMultiProviderCollision,
  AppProviderMissingToken,
  ProvidersCollision,
  MetaOverrideFailure,
} from '#errors';
import type { OnModuleInit } from './hooks.js';
import { isMultiProvider } from '#di/utils.js';
import { Injector } from '#di/injector.js';
import { PROVIDERS_PER_APP } from './constants.js';

export class BaseAppInitializer {
  protected normalizedModuleMeta: NormalizedModuleMeta;
  protected injectorPerApp: Injector;

  constructor(
    protected baseAppOptions: BaseAppOptions,
    protected moduleManager: ModuleManager,
    public log: SystemLogMediator,
  ) {}

  /**
   * _Note:_ after call this method, you need call `this.systemLogMediator.flush()`.
   */
  bootstrapProvidersPerApp() {
    this.normalizedModuleMeta = this.moduleManager.getNormalizedModuleMeta('root', true);
    this.prepareProvidersPerApp();
    this.addDefaultProvidersPerApp();
    this.createInjectorAndSetLogMediator();
  }

  /**
   * 1. checks collisions for non-root exported providers per app;
   * 2. merges these providers with providers that declared on the root module;
   * 3. merges resolved providers per app.
   */
  protected prepareProvidersPerApp() {
    // Here we work only with providers declared at the application level.

    const exportedProviders = this.moduleManager.providersPerApp;
    const exportedNormProviders = normalizeProviders(exportedProviders);
    const exportedTokens = exportedNormProviders.map((np) => np.token);
    const exportedMultiTokens = exportedNormProviders.filter((np) => np.multi).map((np) => np.token);
    const resolvedTokens = this.normalizedModuleMeta.resolvedCollisionsPerApp.map(([token]) => token);
    const defaultTokens = getTokens(defaultProvidersPerApp);
    const rootTokens = getTokens(this.normalizedModuleMeta.providersPerApp);
    const mergedTokens = [...exportedTokens, ...defaultTokens];
    const exportedTokensDuplicates = getDuplicates(mergedTokens).filter(
      (d) => ![...resolvedTokens, ...rootTokens, ...exportedMultiTokens].includes(d),
    );
    const mergedProviders = [...defaultProvidersPerApp, ...exportedProviders];
    const collisions = getCollisions(exportedTokensDuplicates, mergedProviders);
    if (collisions.length) {
      const modulesNames = this.findModulesCausedCollisions(collisions);
      throw new ProvidersCollision(this.normalizedModuleMeta.name, collisions, modulesNames, 'App');
    }
    exportedProviders.push(...this.getResolvedCollisionsPerApp());
    this.normalizedModuleMeta.providersPerApp.unshift(...getLastProviders(exportedProviders));
  }

  protected findModulesCausedCollisions(collisions: any[]) {
    const modulesNames: string[] = [];

    this.moduleManager.getModulesMap().forEach((meta) => {
      const tokens = getTokens(meta.providersPerApp);
      const moduleCausesCollisions = tokens.some((t) => collisions.includes(t));
      if (moduleCausesCollisions) {
        modulesNames.push(meta.name);
      }
    });

    return modulesNames;
  }

  protected getResolvedCollisionsPerApp() {
    const rootModuleName = this.moduleManager.getNormalizedModuleMeta('root', true).name;
    const resolvedProviders: Provider[] = [];
    this.normalizedModuleMeta.resolvedCollisionsPerApp.forEach(([token, module]) => {
      const moduleName = getDebugClassName(module) || 'unknown';
      const tokenName = token.name || token;
      const normalizedModuleMeta = this.moduleManager.getNormalizedModuleMeta(module);
      if (!normalizedModuleMeta) {
        throw new ModuleNotImported(rootModuleName, moduleName, tokenName);
      }
      const provider = getLastProviders(normalizedModuleMeta.providersPerApp).find((p) => getToken(p) === token);
      if (!provider) {
        throw new AppProviderMissingToken(rootModuleName, moduleName, tokenName);
      }
      if (isMultiProvider(provider)) {
        throw new AppMultiProviderCollision(rootModuleName, moduleName, tokenName);
      }
      resolvedProviders.push(provider);
    });

    return resolvedProviders;
  }

  async bootstrapModulesAndExtensions() {
    const deepModulesImporter = new DeepModulesImporter({
      moduleManager: this.moduleManager,
      shallowModuleImportsMap: this.collectProvidersShallow(this.moduleManager),
      providersPerApp: this.normalizedModuleMeta.providersPerApp,
      log: this.log,
    });
    const { extensionCounters, mResolvedModuleMeta } = deepModulesImporter.importModulesDeep();
    await this.handleExtensions(mResolvedModuleMeta, extensionCounters);
    return this.injectorPerApp;
  }

  async reinit(autocommit: boolean = true): Promise<void | Error> {
    this.log.flush();
    LogMediator.bufferLogs = true;
    this.log.preserveLogger();
    this.log.startReinitApp(this);
    // Before init new logger, works previous logger.
    try {
      this.moduleManager.startTransaction();
      this.moduleManager.reset();
      this.bootstrapProvidersPerApp();
      (this.log as PublicLogMediator).updateOutputLogLevel();
    } catch (err) {
      this.log.restorePreviousLogger();
      (this.log as PublicLogMediator).updateOutputLogLevel();
      LogMediator.bufferLogs = false;
      this.log.flush();
      return this.handleReinitError(err);
    }
    // After init new logger, works new logger.
    try {
      await this.bootstrapModulesAndExtensions();
      (this.log as PublicLogMediator).updateOutputLogLevel();
      if (autocommit) {
        this.moduleManager.commit();
      } else {
        this.log.skippingAutocommitModulesConfig(this);
      }
      this.log.finishReinitApp(this);
    } catch (err) {
      return this.handleReinitError(err);
    } finally {
      LogMediator.bufferLogs = false;
      this.log.flush();
    }
  }

  protected async handleReinitError(err: unknown) {
    this.log.printReinitError(this, err);
    this.log.startRollbackModuleConfigChanges(this);
    this.moduleManager.rollback();
    this.bootstrapProvidersPerApp();
    await this.bootstrapModulesAndExtensions();
    (this.log as PublicLogMediator).updateOutputLogLevel();
    this.log.successfulRollbackModuleConfigChanges(this);
    return err as Error;
  }

  protected addDefaultProvidersPerApp() {
    this.normalizedModuleMeta.providersPerApp.unshift(
      ...defaultProvidersPerApp,
      { token: BaseAppOptions, useValue: this.baseAppOptions },
      { token: ModuleManager, useValue: this.moduleManager },
      { token: BaseAppInitializer, useValue: this },
    );
  }

  /**
   * Creates injector per the application and sets log.
   */
  protected createInjectorAndSetLogMediator() {
    this.injectorPerApp = Injector.resolveAndCreate(this.normalizedModuleMeta.providersPerApp, 'App');
    this.log = this.injectorPerApp.get(SystemLogMediator) as SystemLogMediator;
    return this.injectorPerApp;
  }

  protected collectProvidersShallow(moduleManager: ModuleManager) {
    const shallowModulesImporter1 = new ShallowModulesImporter();
    const appProviders = shallowModulesImporter1.exportAppProviders(moduleManager);
    this.log.printAppProviders(this, appProviders);
    const shallowModulesImporter2 = new ShallowModulesImporter();
    const { modRefId, allInitHooks } = moduleManager.getNormalizedModuleMeta('root', true);
    const shallowModuleImportsMap = shallowModulesImporter2.importModulesShallow({
      appProviders,
      modRefId,
      moduleManager,
      unfinishedScanModules: new Set(),
    });
    if (allInitHooks.size == 0) {
      return shallowModuleImportsMap;
    }
    const mergedShallowModuleImportsMap: Map<ModRefId, ShallowModuleImports> = new Map();
    // @todo Refactor this.
    allInitHooks.forEach((initHooks, decorator) => {
      const val = initHooks.importModulesShallow({
        moduleManager,
        appProviders,
        modRefId,
        unfinishedScanModules: new Set(),
      });
      shallowModuleImportsMap.forEach((shallowModuleImports, modRefId) => {
        const shallowImportedModule = val.get(modRefId)!;
        const mergedShallowModuleImports = mergedShallowModuleImportsMap.get(modRefId);
        if (mergedShallowModuleImports) {
          mergedShallowModuleImports.initImportRegistryMap.set(decorator, shallowImportedModule);
        } else {
          mergedShallowModuleImportsMap.set(modRefId, {
            ...shallowModuleImports,
            initImportRegistryMap: new Map([[decorator, shallowImportedModule]]),
          });
        }
      });
    });
    return mergedShallowModuleImportsMap;
  }

  protected async handleExtensions(
    mResolvedModuleMeta: Map<ModRefId, ResolvedModuleMeta>,
    extensionCounters: ExtensionCounters,
  ) {
    const extensionContext = new ExtensionContext();

    for (const [, resolvedModuleMetadata] of mResolvedModuleMeta) {
      const { normalizedModuleMeta, aOrderedExtensions } = this.overrideMetaBeforeExtensionHanling(
        resolvedModuleMetadata.normalizedModuleMeta,
        resolvedModuleMetadata.aOrderedExtensions,
      );
      const injectorPerMod = this.injectorPerApp.resolveAndCreateChild(normalizedModuleMeta.providersPerMod, 'Mod');
      const systemLogMediator = injectorPerMod.pull(SystemLogMediator) as SystemLogMediator;
      const { extensionProviders } = normalizedModuleMeta;
      if (!extensionProviders.length) {
        systemLogMediator.skippingStartExtensions(this);
        continue;
      }
      const providers = this.getProvidersForExtensions(resolvedModuleMetadata, extensionCounters, extensionContext);
      const injectorForExtensions = injectorPerMod.resolveAndCreateChild(providers, 'injectorOfExtensions');
      const extensionManager = injectorForExtensions.get(InternalExtensionManager) as InternalExtensionManager;

      systemLogMediator.startExtensions(this);
      this.decreaseExtensionsCounters(extensionCounters, extensionProviders);
      await this.handleExtensionsPerMod(normalizedModuleMeta, aOrderedExtensions, extensionManager, systemLogMediator);
      this.logExtensionsStatistic(this.injectorPerApp, systemLogMediator);
    }
    await this.perAppHandling(mResolvedModuleMeta, extensionContext);
  }

  protected async perAppHandling(
    mResolvedModuleMeta: Map<ModRefId, ResolvedModuleMeta>,
    extensionContext: ExtensionContext,
  ) {
    for (const [ExtCls, mExtensions] of extensionContext.mExtensionPendingList) {
      for (const extension of mExtensions.values()) {
        try {
          await extension.stage1?.(true);
        } catch (err: any) {
          const groupName = getProviderName(ExtCls);
          throw new MetadataCollectionFailure(groupName, err);
        }
      }
    }

    for (const [modRefId, { normalizedModuleMeta }] of mResolvedModuleMeta) {
      try {
        this.overrideMetaAfterStage1(normalizedModuleMeta.modRefId, normalizedModuleMeta);
        normalizedModuleMeta.initMeta.forEach((meta) =>
          this.overrideMetaAfterStage1(normalizedModuleMeta.modRefId, meta),
        );
      } catch (err: any) {
        const debugModuleName = getDebugClassName(modRefId) || 'unknown';
        throw new MetaOverrideFailure(debugModuleName, err);
      }
    }

    // After the extensions have added new providers, injectorPerApp needs to be recreated one last time.
    this.createInjectorAndSetLogMediator();

    for (const [modRefId, { normalizedModuleMeta }] of mResolvedModuleMeta) {
      try {
        const injectorPerMod = await this.initModuleAndGetInjectorPerMod(normalizedModuleMeta);
        this.moduleManager.setInjectorPerMod(modRefId, injectorPerMod);
      } catch (err: any) {
        const debugModuleName = getDebugClassName(modRefId) || 'unknown';
        throw new ModuleInjectorCreationFailure(debugModuleName, err);
      }
    }

    for (const [modRefId, extensionSet] of extensionContext.mStage) {
      for (const ext of extensionSet) {
        try {
          if (!ext.stage2) {
            continue;
          }
          const injectorPerMod = this.moduleManager.getInjectorPerMod(modRefId, true);
          await ext.stage2(injectorPerMod);
        } catch (err: any) {
          const debugModuleName = getDebugClassName(modRefId) || 'unknown';
          throw new Stage2InitFailure(debugModuleName, ext.constructor.name, err);
        }
      }
    }

    for (const [modRefId, extensionSet] of extensionContext.mStage) {
      for (const ext of extensionSet) {
        try {
          if (!ext.stage3) {
            continue;
          }
          await ext.stage3();
        } catch (err: any) {
          const debugModuleName = getDebugClassName(modRefId) || 'unknown';
          throw new Stage3InitFailure(debugModuleName, ext.constructor.name, err);
        }
      }
    }
  }

  protected async initModuleAndGetInjectorPerMod(normalizedModuleMeta: NormalizedModuleMeta): Promise<Injector> {
    const Mod = getModule(normalizedModuleMeta.modRefId);
    const extendedProvidersPerMod = [Mod, ...normalizedModuleMeta.providersPerMod];
    const injectorPerApp = this.injectorPerApp;
    const injectorPerMod = injectorPerApp.resolveAndCreateChild(extendedProvidersPerMod, 'Mod');
    await (injectorPerMod.get(Mod) as Partial<OnModuleInit>).onModuleInit?.(); // Instantiate the class of the module and call the hook.
    return injectorPerMod;
  }

  /**
   * Note that this method is used for `@ditsmod/testing`.
   */
  protected getProvidersForExtensions(
    resolvedModuleMetadata: ResolvedModuleMeta,
    extensionCounters: ExtensionCounters,
    extensionContext: ExtensionContext,
  ): Provider[] {
    return [
      InternalExtensionManager,
      { token: ExtensionManager, useToken: InternalExtensionManager },
      { token: ExtensionContext, useValue: extensionContext },
      { token: ResolvedModuleMeta, useValue: resolvedModuleMetadata },
      { token: ExtensionCounters, useValue: extensionCounters },
      { token: PROVIDERS_PER_APP, useValue: this.normalizedModuleMeta.providersPerApp },
      ...resolvedModuleMetadata.normalizedModuleMeta.extensionProviders,
    ];
  }

  protected async handleExtensionsPerMod(
    normalizedModuleMeta: NormalizedModuleMeta,
    aOrderedExtensions: ExtensionClass[],
    extensionManager: InternalExtensionManager,
    systemLogMediator: SystemLogMediator,
  ) {
    systemLogMediator.sequenceOfExtensions(this, aOrderedExtensions);
    await extensionManager.internalStage1(normalizedModuleMeta, aOrderedExtensions);
  }

  /**
   * This method is needed to be able to override the metadata during testing.
   *
   * See `TestAppInitializer` in `@ditsmod/testing` for more info.
   */
  protected overrideMetaBeforeExtensionHanling(
    normalizedModuleMeta: NormalizedModuleMeta,
    aOrderedExtensions: ExtensionClass[],
  ) {
    return { normalizedModuleMeta, aOrderedExtensions };
  }

  /**
   * This method is needed to be able to override the metadata during testing.
   *
   * See `TestAppInitializer` in `@ditsmod/testing` for more info.
   */
  protected overrideMetaAfterStage1(modRefId: ModRefId, providersByLevel: ProvidersByLevel): void {}

  protected decreaseExtensionsCounters(extensionCounters: ExtensionCounters, providers: Provider[]) {
    const { mExtensions } = extensionCounters;
    const uniqTargets = new Set<Provider>(getProvidersTargets(providers));

    uniqTargets.forEach((target) => {
      const counter = mExtensions.get(target)!;
      mExtensions.set(target, counter - 1);
    });
  }

  protected logExtensionsStatistic(injectorPerApp: Injector, systemLogMediator: SystemLogMediator) {
    const counter = injectorPerApp.get(ExtensionStatistics);
    const extensions = counter.getInitedExtensions();
    const names = Array.from(extensions)
      .map((e) => e.constructor.name)
      .join(', ');
    systemLogMediator.totalInitedExtensions(this, extensions.size, names);
    counter.resetInitedExtensionsSet();
  }
}
