import { ChainError } from '@ts-stack/chain-error';

import { Injector, isMultiProvider } from '#di';
import { ImportsResolver } from '#init/imports-resolver.js';
import { Logger } from '#logger/logger.js';
import { SystemErrorMediator } from '#error/system-error-mediator.js';
import { LogMediator } from '#logger/log-mediator.js';
import { PublicLogMediator, SystemLogMediator } from '#logger/system-log-mediator.js';
import { NormalizedMeta } from '#types/normalized-meta.js';
import { BaseAppOptions } from '#init/base-app-options.js';
import { ModuleFactory } from '#init/module-factory.js';
import { Counter } from '#extension/counter.js';
import { defaultProvidersPerApp } from './default-providers-per-app.js';
import { ExtensionsContext } from '#extension/extensions-context.js';
import { ExtensionsManager, InternalExtensionsManager } from '#extension/extensions-manager.js';
import { ModuleManager } from '#init/module-manager.js';
import { PerAppService } from '#services/per-app.service.js';
import { ModRefId } from '#types/mix.js';
import { Provider } from '#di/types-and-models.js';
import { ExtensionCounters } from '#extension/extension-types.js';
import { getCollisions } from '#utils/get-collisions.js';
import { getDuplicates } from '#utils/get-duplicates.js';
import { getLastProviders } from '#utils/get-last-providers.js';
import { getProvidersTargets, getToken, getTokens } from '#utils/get-tokens.js';
import { normalizeProviders } from '#utils/ng-utils.js';
import { throwProvidersCollisionError } from '#utils/throw-providers-collision-error.js';
import { MetadataPerMod2 } from '#types/metadata-per-mod.js';
import { getProviderName } from '#utils/get-provider-name.js';
import { getModule } from '#utils/get-module.js';
import { getDebugClassName } from '#utils/get-debug-class-name.js';

export class BaseAppInitializer {
  protected perAppService = new PerAppService();
  protected baseMeta: NormalizedMeta;

  constructor(
    protected baseAppOptions: BaseAppOptions,
    protected moduleManager: ModuleManager,
    public systemLogMediator: SystemLogMediator,
  ) {}

  /**
   * _Note:_ after call this method, you need call `this.systemLogMediator.flush()`.
   */
  bootstrapProvidersPerApp() {
    this.baseMeta = this.moduleManager.getMetadata('root', true);
    this.perAppService.providers = [];
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
    const resolvedTokens = this.baseMeta.resolvedCollisionsPerApp.map(([token]) => token);
    const defaultTokens = getTokens(defaultProvidersPerApp);
    const rootTokens = getTokens(this.baseMeta.providersPerApp);
    const mergedTokens = [...exportedTokens, ...defaultTokens];
    const exportedTokensDuplicates = getDuplicates(mergedTokens).filter(
      (d) => ![...resolvedTokens, ...rootTokens, ...exportedMultiTokens].includes(d),
    );
    const mergedProviders = [...defaultProvidersPerApp, ...exportedProviders];
    const collisions = getCollisions(exportedTokensDuplicates, mergedProviders);
    if (collisions.length) {
      const modulesNames = this.findModulesCausedCollisions(collisions);
      throwProvidersCollisionError(this.baseMeta.name, collisions, modulesNames);
    }
    exportedProviders.push(...this.getResolvedCollisionsPerApp());
    this.baseMeta.providersPerApp.unshift(...getLastProviders(exportedProviders));
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
    this.baseMeta.resolvedCollisionsPerApp.forEach(([token, module]) => {
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
      this.baseMeta.providersPerApp,
      this.systemLogMediator,
      new SystemErrorMediator({ moduleName: this.baseMeta.name }),
    );
    const { extensionCounters, mMetadataPerMod2 } = importsResolver.resolve();
    await this.handleExtensions(mMetadataPerMod2, extensionCounters);
    const injectorPerApp = this.perAppService.reinitInjector();
    this.systemLogMediator = injectorPerApp.get(SystemLogMediator) as SystemLogMediator;
    // this.preRouter = injectorPerApp.get(PreRouter) as PreRouter;
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
    this.baseMeta.providersPerApp.unshift(
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
    const injectorPerApp = this.perAppService.reinitInjector(this.baseMeta.providersPerApp);
    this.systemLogMediator = injectorPerApp.get(SystemLogMediator) as SystemLogMediator;
  }

  protected bootstrapModuleFactory(moduleManager: ModuleManager) {
    const moduleFactory1 = new ModuleFactory();
    const globalProviders = moduleFactory1.exportGlobalProviders(moduleManager);
    this.systemLogMediator.printGlobalProviders(this, globalProviders);
    const moduleFactory2 = new ModuleFactory();
    const { modRefId } = moduleManager.getMetadata('root', true);
    return moduleFactory2.bootstrap(globalProviders, modRefId, moduleManager, new Set());
  }

  protected async handleExtensions(
    mMetadataPerMod2: Map<ModRefId, MetadataPerMod2>,
    extensionCounters: ExtensionCounters,
  ) {
    const extensionsContext = new ExtensionsContext();
    const injectorPerApp = this.perAppService.reinitInjector([{ token: PerAppService, useValue: this.perAppService }]);

    for (const [, metadataPerMod2] of mMetadataPerMod2) {
      let { baseMeta } = metadataPerMod2;
      baseMeta = this.overrideMetaBeforeExtensionHanling(baseMeta);
      const injectorPerMod = injectorPerApp.resolveAndCreateChild(baseMeta.providersPerMod, 'Mod');
      injectorPerMod.pullAndSave(Logger);
      const systemLogMediator = injectorPerMod.pullAndSave(SystemLogMediator) as SystemLogMediator;
      const { extensionsProviders } = baseMeta;
      if (!extensionsProviders.length) {
        systemLogMediator.skippingStartExtensions(this);
        continue;
      }
      const providers = this.getProvidersForExtensions(metadataPerMod2, extensionCounters, extensionsContext);
      const injectorForExtensions = injectorPerMod.resolveAndCreateChild(providers, 'ForExtensions');
      const extensionsManager = injectorForExtensions.get(InternalExtensionsManager) as InternalExtensionsManager;

      systemLogMediator.startExtensions(this);
      this.decreaseExtensionsCounters(extensionCounters, extensionsProviders);
      await this.handleExtensionsPerMod(baseMeta, extensionsManager, systemLogMediator);
      this.logExtensionsStatistic(injectorPerApp, systemLogMediator);
    }
    await this.perAppHandling(mMetadataPerMod2, extensionsContext);
  }

  protected async perAppHandling(
    mMetadataPerMod2: Map<ModRefId, MetadataPerMod2>,
    extensionsContext: ExtensionsContext,
  ) {
    for (const [ExtCls, mExtensions] of extensionsContext.mExtensionPendingList) {
      for (const extension of mExtensions.values()) {
        try {
          await extension.stage1?.(true);
        } catch (err: any) {
          const groupName = getProviderName(ExtCls);
          const msg = `Metadata collection from all modules for ${groupName} failed`;
          throw new ChainError(msg, err);
        }
      }
    }

    for (const [modRefId, metadataPerMod2] of mMetadataPerMod2) {
      try {
        const meta = this.overrideMetaAfterStage1(metadataPerMod2.baseMeta);
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

  protected async initModuleAndGetInjectorPerMod(meta: NormalizedMeta): Promise<Injector> {
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
      InternalExtensionsManager,
      { token: ExtensionsManager, useToken: InternalExtensionsManager },
      { token: ExtensionsContext, useValue: extensionsContext },
      { token: MetadataPerMod2, useValue: metadataPerMod2 },
      { token: ExtensionCounters, useValue: extensionCounters },
      ...metadataPerMod2.baseMeta.extensionsProviders,
    ];
  }

  protected async handleExtensionsPerMod(
    meta: NormalizedMeta,
    extensionsManager: InternalExtensionsManager,
    systemLogMediator: SystemLogMediator,
  ) {
    systemLogMediator.sequenceOfExtensionExtensions(this, meta.aOrderedExtensions);
    await extensionsManager.internalStage1(meta);
  }

  /**
   * This method is needed to be able to override the metadata during testing.
   *
   * See `TestAppInitializer` in `@ditsmod/testing` for more info.
   */
  protected overrideMetaBeforeExtensionHanling(meta: NormalizedMeta) {
    return meta;
  }

  /**
   * This method is needed to be able to override the metadata during testing.
   *
   * See `TestAppInitializer` in `@ditsmod/testing` for more info.
   */
  protected overrideMetaAfterStage1(meta: NormalizedMeta) {
    return meta;
  }

  protected decreaseExtensionsCounters(extensionCounters: ExtensionCounters, providers: Provider[]) {
    const { mExtensions } = extensionCounters;
    const uniqTargets = new Set<Provider>(getProvidersTargets(providers));

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
}
