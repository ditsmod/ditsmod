import { ChainError } from '@ts-stack/chain-error';

import { InjectionToken, Injector, isMultiProvider } from '#di';
import { ImportsResolver } from '#init/imports-resolver.js';
import { Logger } from '#logger/logger.js';
import { SystemErrorMediator } from '#error/system-error-mediator.js';
import { LogMediator } from '#logger/log-mediator.js';
import { PublicLogMediator, SystemLogMediator } from '#logger/system-log-mediator.js';
import { NormalizedModuleMetadata } from '#types/normalized-module-metadata.js';
import { AppOptions } from '#types/app-options.js';
import { ModuleFactory } from '#init/module-factory.js';
import { Counter } from '#extension/counter.js';
import { defaultProvidersPerApp } from './default-providers-per-app.js';
import { ExtensionsContext } from '#extension/extensions-context.js';
import { ExtensionsManager, StageIteration, StageIterationMap } from '#extension/extensions-manager.js';
import { ModuleManager } from '#init/module-manager.js';
import { PerAppService } from '#services/per-app.service.js';
import { PreRouter } from '#services/pre-router.js';
import { ModRefId, ModuleType, Provider } from '#types/mix.js';
import { ModuleWithParams } from '#types/module-metadata.js';
import { ExtensionCounters, ExtensionsGroupToken } from '#extension/extension-types.js';
import { RequestListener } from '#types/server-options.js';
import { getCollisions } from '#utils/get-collisions.js';
import { getDuplicates } from '#utils/get-duplicates.js';
import { getLastProviders } from '#utils/get-last-providers.js';
import { getProvidersTargets, getToken, getTokens } from '#utils/get-tokens.js';
import { normalizeProviders } from '#utils/ng-utils.js';
import { throwProvidersCollisionError } from '#utils/throw-providers-collision-error.js';
import { isRootModule } from '#utils/type-guards.js';
import { SERVER } from '#public-api/constans.js';
import { HttpServer } from '#types/server-options.js';
import { MetadataPerMod2 } from '#types/metadata-per-mod.js';
import { getProviderName } from '#utils/get-provider-name.js';
import { getModule } from '#utils/get-module.js';
import { getDebugClassName } from '#utils/get-debug-class-name.js';

export class AppInitializer {
  protected perAppService = new PerAppService();
  protected preRouter: PreRouter;
  protected meta: NormalizedModuleMetadata;
  protected unfinishedScanModules = new Set<ModuleType | ModuleWithParams>();
  protected server: HttpServer;

  constructor(
    protected appOptions: AppOptions,
    protected moduleManager: ModuleManager,
    public systemLogMediator: SystemLogMediator,
  ) {}

  /**
   * _Note:_ after call this method, you need call `this.systemLogMediator.flush()`.
   */
  bootstrapProvidersPerApp() {
    this.meta = this.moduleManager.getMetadata('root', true);
    this.perAppService.providers = [];
    this.prepareProvidersPerApp();
    this.addDefaultProvidersPerApp();
    this.createInjectorAndSetLogMediator();
  }

  protected setServer(server: HttpServer) {
    this.server = server;
  }

  /**
   * 1. checks collisions for non-root exported providers per app;
   * 2. merges these providers with providers that declared on the root module;
   * 3. merges resolved providers per app.
   */
  protected prepareProvidersPerApp() {
    // Here we work only with providers declared at the application level.

    this.unfinishedScanModules.clear();
    const exportedProviders = this.collectProvidersPerApp(this.meta);
    const exportedNormProviders = normalizeProviders(exportedProviders);
    const exportedTokens = exportedNormProviders.map((np) => np.token);
    const exportedMultiTokens = exportedNormProviders.filter((np) => np.multi).map((np) => np.token);
    const resolvedTokens = this.meta.resolvedCollisionsPerApp.map(([token]) => token);
    const defaultTokens = getTokens(defaultProvidersPerApp);
    const rootTokens = getTokens(this.meta.providersPerApp);
    const mergedTokens = [...exportedTokens, ...defaultTokens];
    const exportedTokensDuplicates = getDuplicates(mergedTokens).filter(
      (d) => ![...resolvedTokens, ...rootTokens, ...exportedMultiTokens].includes(d),
    );
    const mergedProviders = [...defaultProvidersPerApp, ...exportedProviders];
    const collisions = getCollisions(exportedTokensDuplicates, mergedProviders);
    if (collisions.length) {
      const modulesNames = this.findModulesCausedCollisions(collisions);
      throwProvidersCollisionError(this.meta.name, collisions, modulesNames);
    }
    exportedProviders.push(...this.getResolvedCollisionsPerApp());
    this.meta.providersPerApp.unshift(...getLastProviders(exportedProviders));
  }

  /**
   * Recursively collects per app providers from feature modules.
   */
  protected collectProvidersPerApp(meta1: NormalizedModuleMetadata) {
    const aModRefId: ModRefId[] = [
      ...meta1.appendsModules,
      ...meta1.appendsWithParams,
      ...meta1.importsModules,
      ...meta1.importsWithParams,
      ...meta1.exportsModules,
      ...meta1.exportsWithParams,
    ];
    const providersPerApp: Provider[] = [];
    // Removes duplicate (because of reexports modules)
    for (const modRefId of new Set(aModRefId)) {
      if (this.unfinishedScanModules.has(modRefId)) {
        continue;
      }
      const meta2 = this.moduleManager.getMetadata(modRefId, true);
      this.unfinishedScanModules.add(modRefId);
      providersPerApp.push(...this.collectProvidersPerApp(meta2));
      this.unfinishedScanModules.delete(modRefId);
    }
    const currProvidersPerApp = isRootModule(meta1) ? [] : meta1.providersPerApp;

    return [...providersPerApp, ...currProvidersPerApp];
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
    const rootMeta = this.moduleManager.getMetadata('root', true);
    const resolvedProviders: Provider[] = [];
    this.meta.resolvedCollisionsPerApp.forEach(([token, module]) => {
      const moduleName = getDebugClassName(module);
      const tokenName = token.name || token;
      const meta = this.moduleManager.getMetadata(module);
      let errorMsg =
        `Resolving collisions for providersPerApp in ${rootMeta.name} failed: ` +
        `${tokenName} mapped with ${moduleName}, but `;
      if (!meta) {
        errorMsg += `${moduleName} is not imported into the application.`;
        throw new Error(errorMsg);
      }
      const provider = getLastProviders(meta.providersPerApp).find((p) => getToken(p) === token);
      if (!provider) {
        errorMsg += `providersPerApp does not includes ${tokenName} in this module.`;
        throw new Error(errorMsg);
      }
      if (isMultiProvider(provider)) {
        errorMsg +=
          `${tokenName} is a token of the multi providers, and in this case ` +
          'it should not be included in resolvedCollisionsPerApp.';
        throw new Error(errorMsg);
      }
      resolvedProviders.push(provider);
    });

    return resolvedProviders;
  }

  async bootstrapModulesAndExtensions() {
    const appMetadataMap = this.bootstrapModuleFactory(this.moduleManager);
    const importsResolver = new ImportsResolver(
      this.moduleManager,
      appMetadataMap,
      this.meta.providersPerApp,
      this.systemLogMediator,
      new SystemErrorMediator({ moduleName: this.meta.name }),
    );
    const { extensionCounters, mMetadataPerMod2 } = importsResolver.resolve();
    await this.handleExtensions(mMetadataPerMod2, extensionCounters);
    const injectorPerApp = this.perAppService.reinitInjector();
    this.systemLogMediator = injectorPerApp.get(SystemLogMediator) as SystemLogMediator;
    this.preRouter = injectorPerApp.get(PreRouter) as PreRouter;
    return appMetadataMap;
  }

  async reinit(autocommit: boolean = true): Promise<void | Error> {
    this.systemLogMediator.flush();
    LogMediator.bufferLogs = true;
    this.systemLogMediator.preserveLogger();
    this.systemLogMediator.startReinitApp(this);
    // Before init new logger, works previous logger.
    try {
      this.bootstrapProvidersPerApp();
      (this.systemLogMediator as PublicLogMediator).updateOutputLogLevel();
    } catch (err) {
      this.systemLogMediator.restorePreviousLogger();
      (this.systemLogMediator as PublicLogMediator).updateOutputLogLevel();
      LogMediator.bufferLogs = false;
      this.systemLogMediator.flush();
      return this.handleReinitError(err);
    }
    // After init new logger, works new logger.
    try {
      await this.bootstrapModulesAndExtensions();
      (this.systemLogMediator as PublicLogMediator).updateOutputLogLevel();
      if (autocommit) {
        this.moduleManager.commit();
      } else {
        this.systemLogMediator.skippingAutocommitModulesConfig(this);
      }
      this.systemLogMediator.finishReinitApp(this);
    } catch (err) {
      return this.handleReinitError(err);
    } finally {
      LogMediator.bufferLogs = false;
      this.systemLogMediator.flush();
    }
  }

  protected async handleReinitError(err: unknown) {
    this.systemLogMediator.printReinitError(this, err);
    this.systemLogMediator.startRollbackModuleConfigChanges(this);
    this.moduleManager.rollback();
    this.bootstrapProvidersPerApp();
    await this.bootstrapModulesAndExtensions();
    (this.systemLogMediator as PublicLogMediator).updateOutputLogLevel();
    this.systemLogMediator.successfulRollbackModuleConfigChanges(this);
    return err as Error;
  }

  protected addDefaultProvidersPerApp() {
    this.meta.providersPerApp.unshift(
      ...defaultProvidersPerApp,
      { token: SERVER, useFactory: () => this.server },
      { token: AppOptions, useValue: this.appOptions },
      { token: ModuleManager, useValue: this.moduleManager },
      { token: AppInitializer, useValue: this },
    );
  }

  /**
   * Creates injector per the application and sets log.
   */
  protected createInjectorAndSetLogMediator() {
    const injectorPerApp = this.perAppService.reinitInjector(this.meta.providersPerApp);
    this.systemLogMediator = injectorPerApp.get(SystemLogMediator) as SystemLogMediator;
  }

  protected bootstrapModuleFactory(moduleManager: ModuleManager) {
    const moduleFactory1 = new ModuleFactory();
    const globalProviders = moduleFactory1.exportGlobalProviders(moduleManager, this.meta.providersPerApp);
    this.systemLogMediator.printGlobalProviders(this, globalProviders);
    const moduleFactory2 = new ModuleFactory();
    const { modRefId } = moduleManager.getMetadata('root', true);
    return moduleFactory2.bootstrap(this.meta.providersPerApp, globalProviders, '', modRefId, moduleManager, new Set());
  }

  protected async handleExtensions(
    mMetadataPerMod2: Map<ModRefId, MetadataPerMod2>,
    extensionCounters: ExtensionCounters,
  ) {
    const extensionsContext = new ExtensionsContext();
    const injectorPerApp = this.perAppService.reinitInjector([{ token: PerAppService, useValue: this.perAppService }]);

    for (const [, metadataPerMod2] of mMetadataPerMod2) {
      let { meta } = metadataPerMod2;
      meta = this.overrideMetaBeforeExtensionHanling(meta);
      const injectorPerMod = injectorPerApp.resolveAndCreateChild(meta.providersPerMod, 'Mod');
      injectorPerMod.pullAndSave(Logger);
      const systemLogMediator = injectorPerMod.pullAndSave(SystemLogMediator) as SystemLogMediator;
      const { extensionsProviders } = meta;
      if (!extensionsProviders.length) {
        systemLogMediator.skippingStartExtensions(this);
        continue;
      }
      const providers = this.getProvidersForExtensions(metadataPerMod2, extensionCounters, extensionsContext);
      const injectorForExtensions = injectorPerMod.resolveAndCreateChild(providers, 'ForExtensions');
      const extensionsManager = injectorForExtensions.get(ExtensionsManager) as ExtensionsManager;

      systemLogMediator.startExtensions(this);
      this.decreaseExtensionsCounters(extensionCounters, extensionsProviders);
      await this.handleExtensionsPerMod(meta, extensionsManager);
      this.logExtensionsStatistic(injectorPerApp, systemLogMediator);
    }
    await this.perAppHandling(mMetadataPerMod2, extensionsContext);
  }

  protected async perAppHandling(
    mMetadataPerMod2: Map<ModRefId, MetadataPerMod2>,
    extensionsContext: ExtensionsContext,
  ) {
    for (const [groupToken, mExtensions] of extensionsContext.mExtensionPendingList) {
      for (const extension of mExtensions.values()) {
        try {
          await extension.stage1?.(true);
        } catch (err: any) {
          const groupName = getProviderName(groupToken);
          const msg = `Metadata collection from all modules for ${groupName} failed`;
          throw new ChainError(msg, err);
        }
      }
    }

    for (const [modRefId, metadataPerMod2] of mMetadataPerMod2) {
      try {
        const meta = this.overrideMetaAfterStage1(metadataPerMod2.meta);
        const injectorPerMod = await this.initModuleAndGetInjectorPerMod(meta);
        this.moduleManager.setInjectorPerMod(modRefId, injectorPerMod);
      } catch (err: any) {
        const debugModuleName = getDebugClassName(modRefId);
        const msg = `${debugModuleName} initialization failed`;
        throw new ChainError(msg, err);
      }
    }

    for (const [modRefId, extensionSet] of extensionsContext.mStage) {
      for (const ext of extensionSet) {
        try {
          if (!ext.stage2) {
            continue;
          }
          const injectorPerMod = this.moduleManager.getInjectorPerMod(modRefId);
          await ext.stage2(injectorPerMod);
        } catch (err: any) {
          const debugModuleName = getDebugClassName(modRefId);
          const msg = `Initialization in ${debugModuleName} -> ${ext.constructor.name} at stage 2 failed`;
          throw new ChainError(msg, err);
        }
      }
    }

    for (const [modRefId, extensionSet] of extensionsContext.mStage) {
      for (const ext of extensionSet) {
        try {
          if (!ext.stage3) {
            continue;
          }
          await ext.stage3();
        } catch (err: any) {
          const debugModuleName = getDebugClassName(modRefId);
          const msg = `Initialization failed in ${debugModuleName} -> ${ext.constructor.name} at stage 3`;
          throw new ChainError(msg, err);
        }
      }
    }
  }

  protected async initModuleAndGetInjectorPerMod(meta: NormalizedModuleMetadata): Promise<Injector> {
    const Mod = getModule(meta.modRefId);
    const extendedProvidersPerMod = [Mod, ...meta.providersPerMod];
    const injectorPerApp = this.perAppService.injector;
    const injectorPerMod = injectorPerApp.resolveAndCreateChild(extendedProvidersPerMod, 'Mod');
    await injectorPerMod.get(Mod).onModuleInit?.(); // Instantiate the class of the module and call the hook.
    return injectorPerMod;
  }

  /**
   * Note that this method is used for `@ditsmod/testing`.
   */
  protected getProvidersForExtensions(
    metadataPerMod2: MetadataPerMod2,
    extensionCounters: ExtensionCounters,
    extensionsContext: ExtensionsContext,
  ): Provider[] {
    return [
      ExtensionsManager,
      { token: ExtensionsContext, useValue: extensionsContext },
      { token: MetadataPerMod2, useValue: metadataPerMod2 },
      { token: ExtensionCounters, useValue: extensionCounters },
      ...metadataPerMod2.meta.extensionsProviders,
    ];
  }

  protected async handleExtensionsPerMod(meta: NormalizedModuleMetadata, extensionsManager: ExtensionsManager) {
    const stageIterationMap = new Map() as StageIterationMap;
    extensionsManager.moduleName = meta.name;
    extensionsManager.stageIterationMap = stageIterationMap;
    const promises: Promise<any>[] = [];

    meta.aOrderedGroups.forEach((groupToken, index) => {
      stageIterationMap.set(groupToken, new StageIteration(index));
    });

    for (const [groupToken, currStageIteration] of stageIterationMap) {
      extensionsManager.currStageIteration = currStageIteration;
      const promise = extensionsManager
        .stage1(groupToken)
        .then(() => extensionsManager.updateExtensionPendingList())
        .catch((err) => {
          const debugModuleName = getDebugClassName(meta.modRefId);
          const msg = `The work of ${groupToken} group in ${debugModuleName} failed`;
          throw new ChainError(msg, { cause: err, name: 'Error' });
        });
      promises.push(promise);
    }

    await Promise.all(promises);

    extensionsManager.setExtensionsToStage2(meta.modRefId);
  }

  /**
   * This method is needed to be able to override the metadata during testing.
   *
   * See `TestAppInitializer` in `@ditsmod/testing` for more info.
   */
  protected overrideMetaBeforeExtensionHanling(meta: NormalizedModuleMetadata) {
    return meta;
  }

  /**
   * This method is needed to be able to override the metadata during testing.
   *
   * See `TestAppInitializer` in `@ditsmod/testing` for more info.
   */
  protected overrideMetaAfterStage1(meta: NormalizedModuleMetadata) {
    return meta;
  }

  protected decreaseExtensionsCounters(extensionCounters: ExtensionCounters, providers: Provider[]) {
    const { mGroupTokens, mExtensions } = extensionCounters;
    const groupTokens = getTokens(providers).filter((token) => token instanceof InjectionToken);
    const uniqGroupTokens = new Set<ExtensionsGroupToken>(groupTokens);
    const uniqTargets = new Set<Provider>(getProvidersTargets(providers));

    uniqGroupTokens.forEach((groupToken) => {
      const counter = mGroupTokens.get(groupToken)!;
      mGroupTokens.set(groupToken, counter - 1);
    });

    uniqTargets.forEach((target) => {
      const counter = mExtensions.get(target)!;
      mExtensions.set(target, counter - 1);
    });
  }

  protected logExtensionsStatistic(injectorPerApp: Injector, systemLogMediator: SystemLogMediator) {
    const counter = injectorPerApp.get(Counter);
    const extensions = counter.getInitedExtensions();
    const names = Array.from(extensions)
      .map((e) => e.constructor.name)
      .join(', ');
    systemLogMediator.totalInitedExtensions(this, extensions.size, names);
    counter.resetInitedExtensionsSet();
  }

  requestListener: RequestListener = (rawReq, rawRes) => this.preRouter.requestListener(rawReq, rawRes);
}

/**
 * This class is needed only to access the protected methods of the `AppInitializer` class.
 */
export class PublicAppInitializer extends AppInitializer {
  override setServer(server: HttpServer) {
    return super.setServer(server);
  }
}
