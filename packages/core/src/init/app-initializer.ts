import { ChainError } from '@ts-stack/chain-error';

import { BeforeToken, InjectionToken, Injector } from '#di';
import { ImportsResolver } from '#init/imports-resolver.js';
import { Logger } from '#logger/logger.js';
import { SystemErrorMediator } from '#error/system-error-mediator.js';
import { LogMediator } from '#logger/log-mediator.js';
import { SystemLogMediator } from '#logger/system-log-mediator.js';
import { NormalizedModuleMetadata } from '#types/normalized-module-metadata.js';
import { AppOptions } from '#types/app-options.js';
import { ModuleFactory } from '#init/module-factory.js';
import { Counter } from '#extension/counter.js';
import { defaultProvidersPerApp } from './default-providers-per-app.js';
import { ExtensionsContext } from '#extension/extensions-context.js';
import { ExtensionsManager } from '#extension/extensions-manager.js';
import { ModuleManager } from '#init/module-manager.js';
import { PerAppService } from '#services/per-app.service.js';
import { PreRouter } from '#services/pre-router.js';
import { ModRefId, ModuleType, Provider } from '#types/mix.js';
import { ModuleWithParams } from '#types/module-metadata.js';
import { Extension, ExtensionCounters, ExtensionsGroupToken } from '#extension/extension-types.js';
import { RequestListener } from '#types/server-options.js';
import { getCollisions } from '#utils/get-collisions.js';
import { getDuplicates } from '#utils/get-duplicates.js';
import { getLastProviders } from '#utils/get-last-providers.js';
import { getProvidersTargets, getToken, getTokens } from '#utils/get-tokens.js';
import { normalizeProviders } from '#utils/ng-utils.js';
import { throwProvidersCollisionError } from '#utils/throw-providers-collision-error.js';
import { isMultiProvider, isNormRootModule } from '#utils/type-guards.js';
import { SERVER } from '#constans';
import { NodeServer } from '#types/server-options.js';
import { MetadataPerMod2 } from '#types/metadata-per-mod.js';
import { getProviderName } from '#utils/get-provider-name.js';
import { getModule } from '#utils/get-module.js';
import { getDebugModuleName } from '#utils/get-debug-module-name.js';

export class AppInitializer {
  protected perAppService = new PerAppService();
  protected preRouter: PreRouter;
  protected meta: NormalizedModuleMetadata;
  protected unfinishedScanModules = new Set<ModuleType | ModuleWithParams>();
  protected server: NodeServer;

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

  protected setServer(server: NodeServer) {
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
   * Recursively collects per app providers from non-root modules.
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
    const currProvidersPerApp = isNormRootModule(meta1) ? [] : meta1.providersPerApp;

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
      const moduleName = getDebugModuleName(module);
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
    } catch (err) {
      this.systemLogMediator.restorePreviousLogger();
      LogMediator.bufferLogs = false;
      this.systemLogMediator.flush();
      return this.handleReinitError(err);
    }
    // After init new logger, works new logger.
    try {
      await this.bootstrapModulesAndExtensions();
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
      const { meta } = metadataPerMod2;
      const preparedMetadataPerMod1 = this.prepareMetadataPerMod1(meta);
      const injectorPerMod = injectorPerApp.resolveAndCreateChild(meta.providersPerMod);
      injectorPerMod.pull(Logger);
      const systemLogMediator = injectorPerMod.pull(SystemLogMediator) as SystemLogMediator;
      const { extensionsProviders } = meta;
      if (!extensionsProviders.length) {
        systemLogMediator.skippingStartExtensions(this);
        continue;
      }
      const injectorForExtensions = this.getInjectorForExtensions(
        metadataPerMod2,
        extensionCounters,
        extensionsContext,
        injectorPerMod,
      );
      const extensionsManager = injectorForExtensions.get(ExtensionsManager) as ExtensionsManager;

      systemLogMediator.startExtensions(this);
      this.decreaseExtensionsCounters(extensionCounters, extensionsProviders);
      await this.handleExtensionsPerMod(preparedMetadataPerMod1, extensionsManager);
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
          throw new ChainError(msg, { name: 'Error', cause: err });
        }
      }
    }

    for (const [modRefId, metadataPerMod2] of mMetadataPerMod2) {
      try {
        const injectorPerMod = this.initModuleAndGetInjectorPerMod(metadataPerMod2.meta);
        this.moduleManager.setInjectorPerMod(modRefId, injectorPerMod);
      } catch (err: any) {
        const debugModuleName = getDebugModuleName(modRefId);
        const msg = `Creating injector per module for ${debugModuleName} failed`;
        throw new ChainError(msg, { name: 'Error', cause: err });
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
          const debugModuleName = getDebugModuleName(modRefId);
          const msg = `Stage2 in ${debugModuleName} -> ${ext.constructor.name} failed`;
          throw new ChainError(msg, { name: 'Error', cause: err });
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
          const debugModuleName = getDebugModuleName(modRefId);
          const msg = `Stage3 in ${debugModuleName} -> ${ext.constructor.name} failed`;
          throw new ChainError(msg, { name: 'Error', cause: err });
        }
      }
    }
  }

  protected initModuleAndGetInjectorPerMod(meta: NormalizedModuleMetadata): Injector {
    const mod = getModule(meta.modRefId);
    const extendedProvidersPerMod = [mod, ...meta.providersPerMod];
    const injectorPerApp = this.perAppService.injector;
    const injectorPerMod = injectorPerApp.resolveAndCreateChild(extendedProvidersPerMod, 'injectorPerMod');
    injectorPerMod.get(mod); // Instantiate the class of the module.
    return injectorPerMod;
  }

  protected getInjectorForExtensions(
    metadataPerMod2: MetadataPerMod2,
    extensionCounters: ExtensionCounters,
    extensionsContext: ExtensionsContext,
    injectorPerMod: Injector,
  ) {
    return injectorPerMod.resolveAndCreateChild([
      ExtensionsManager,
      { token: ExtensionsContext, useValue: extensionsContext },
      { token: MetadataPerMod2, useValue: metadataPerMod2 },
      { token: ExtensionCounters, useValue: extensionCounters },
      ...metadataPerMod2.meta.extensionsProviders,
    ]);
  }

  protected async handleExtensionsPerMod(meta: NormalizedModuleMetadata, extensionsManager: ExtensionsManager) {
    const { extensionsProviders, name: moduleName } = meta;
    const extensionTokens = new Set<InjectionToken<Extension[]>>();
    const beforeTokens = new Set<BeforeToken>();
    for (const token of getTokens<ExtensionsGroupToken>(extensionsProviders)) {
      if (token instanceof BeforeToken) {
        beforeTokens.add(token);
      } else if (token instanceof InjectionToken) {
        extensionTokens.add(token);
      }
    }
    for (const groupToken of extensionTokens) {
      try {
        extensionsManager.moduleName = moduleName;
        extensionsManager.beforeTokens = beforeTokens;
        await extensionsManager.stage1(groupToken);
        extensionsManager.updateExtensionPendingList();
      } catch (error: any) {
        throw new ChainError(moduleName, error);
      }
    }

    extensionsManager.setExtensionsToStage2(meta.modRefId);
  }

  /**
   * This method is needed to be able to forcibly change the metadata (for example, during testing).
   *
   * See `TestAppInitializer` in `@ditsmod/testing` for more info.
   */
  protected prepareMetadataPerMod1(meta: NormalizedModuleMetadata) {
    return meta;
  }

  protected decreaseExtensionsCounters(extensionCounters: ExtensionCounters, providers: Provider[]) {
    const { mGroupTokens, mExtensions } = extensionCounters;
    const groupTokens = getTokens(providers).filter(
      (token) => token instanceof InjectionToken || token instanceof BeforeToken,
    );
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

  requestListener: RequestListener = (nodeReq, nodeRes) => {
    return this.preRouter.requestListener(nodeReq, nodeRes);
  };
}
