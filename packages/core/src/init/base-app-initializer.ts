import { DeepModulesImporter } from '#init/deep-modules-importer.js';
import { LogMediator } from '#logger/log-mediator.js';
import type { PublicLogMediator} from '#logger/system-log-mediator.js';
import { SystemLogMediator } from '#logger/system-log-mediator.js';
import type { BaseMeta } from '#init/base-meta.js';
import { BaseAppOptions } from '#init/base-app-options.js';
import { ShallowModulesImporter } from '#init/shallow-modules-importer.js';
import { Counter } from '#extension/counter.js';
import { defaultProvidersPerApp } from './default-providers-per-app.js';
import { ExtensionContext } from '#extension/extensions-context.js';
import { ExtensionManager, InternalExtensionManager } from '#extension/extension-manager.js';
import { ModuleManager } from '#init/module-manager.js';
import { PerAppService } from '#services/per-app.service.js';
import type { ModRefId } from '#types/mix.js';
import type { Provider } from '#di/top/types-and-models.js';
import type { ExtensionClass} from '#extension/extension-types.js';
import { ExtensionCounters } from '#extension/extension-types.js';
import { getCollisions } from '#utils/get-collisions.js';
import { getDuplicates } from '#utils/get-duplicates.js';
import { getLastProviders } from '#utils/get-last-providers.js';
import { getProvidersTargets, getToken, getTokens } from '#utils/get-tokens.js';
import { normalizeProviders } from '#utils/ng-utils.js';
import { MetadataPerMod2 } from '#types/metadata-per-mod.js';
import { getProviderName } from '#utils/get-provider-name.js';
import { getModule } from '#utils/get-module.js';
import { getDebugClassName } from '#utils/get-debug-class-name.js';
import type { ShallowImports } from './types.js';
import type { ProvidersOnly } from '#types/providers-metadata.js';
import {
  FailedCollectingMetadata,
  FailedCreateInjectorPerMod,
  FailedStage2,
  FailedStage3,
  ModuleNotImportedInApplication,
  CannotResolveCollisionForMultiProviderPerApp,
  ProvidersPerAppMissingTokenName,
  ProvidersCollision,
  FailedOverrideMetaAfterStage1,
} from '#errors';
import type { OnModuleInit } from './hooks.js';
import { isMultiProvider } from '#di/utils.js';
import type { Injector } from '#di/injector.js';
import { PROVIDERS_PER_APP } from './constants.js';

export class BaseAppInitializer {
  protected perAppService = new PerAppService();
  protected baseMeta: BaseMeta;

  constructor(
    protected baseAppOptions: BaseAppOptions,
    protected moduleManager: ModuleManager,
    public log: SystemLogMediator,
  ) {}

  /**
   * _Note:_ after call this method, you need call `this.systemLogMediator.flush()`.
   */
  bootstrapProvidersPerApp() {
    this.baseMeta = this.moduleManager.getBaseMeta('root', true);
    this.perAppService = new PerAppService();
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
    const resolvedTokens = this.baseMeta.resolvedCollisionPerApp.map(([token]) => token);
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
      throw new ProvidersCollision(this.baseMeta.name, collisions, modulesNames);
    }
    exportedProviders.push(...this.getResolvedCollisionPerApp());
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

  protected getResolvedCollisionPerApp() {
    const rootModuleName = this.moduleManager.getBaseMeta('root', true).name;
    const resolvedProviders: Provider[] = [];
    this.baseMeta.resolvedCollisionPerApp.forEach(([token, module]) => {
      const moduleName = getDebugClassName(module) || 'unknown';
      const tokenName = token.name || token;
      const baseMeta = this.moduleManager.getBaseMeta(module);
      if (!baseMeta) {
        throw new ModuleNotImportedInApplication(rootModuleName, moduleName, tokenName);
      }
      const provider = getLastProviders(baseMeta.providersPerApp).find((p) => getToken(p) === token);
      if (!provider) {
        throw new ProvidersPerAppMissingTokenName(rootModuleName, moduleName, tokenName);
      }
      if (isMultiProvider(provider)) {
        throw new CannotResolveCollisionForMultiProviderPerApp(rootModuleName, moduleName, tokenName);
      }
      resolvedProviders.push(provider);
    });

    return resolvedProviders;
  }

  async bootstrapModulesAndExtensions() {
    const deepModulesImporter = new DeepModulesImporter({
      moduleManager: this.moduleManager,
      shallowImportsMap: this.collectProvidersShallow(this.moduleManager),
      providersPerApp: this.baseMeta.providersPerApp,
      log: this.log,
    });
    const { extensionCounters, mMetadataPerMod2 } = deepModulesImporter.importModulesDeep();
    await this.handleExtensions(mMetadataPerMod2, extensionCounters);
    this.log = this.perAppService.injector.get(SystemLogMediator) as SystemLogMediator;
    return this.perAppService.injector;
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
    this.log = injectorPerApp.get(SystemLogMediator) as SystemLogMediator;
  }

  protected collectProvidersShallow(moduleManager: ModuleManager) {
    const shallowModulesImporter1 = new ShallowModulesImporter();
    const appProviders = shallowModulesImporter1.exportAppProviders(moduleManager);
    this.log.printAppProviders(this, appProviders);
    const shallowModulesImporter2 = new ShallowModulesImporter();
    const { modRefId, allInitHooks } = moduleManager.getBaseMeta('root', true);
    const shallowImportsMap = shallowModulesImporter2.importModulesShallow({
      appProviders,
      modRefId,
      moduleManager,
      unfinishedScanModules: new Set(),
    });
    if (allInitHooks.size == 0) {
      return shallowImportsMap;
    }
    const mergedShallowImportsMap: Map<ModRefId, ShallowImports> = new Map();
    // @todo Refactor this.
    allInitHooks.forEach((initHooks, decorator) => {
      const val = initHooks.importModulesShallow({
        moduleManager,
        appProviders,
        modRefId,
        unfinishedScanModules: new Set(),
      });
      shallowImportsMap.forEach((shallowImports, modRefId) => {
        const shallowImportedModule = val.get(modRefId)!;
        const mergedShallowImports = mergedShallowImportsMap.get(modRefId);
        if (mergedShallowImports) {
          mergedShallowImports.initImportRegistryMap.set(decorator, shallowImportedModule);
        } else {
          mergedShallowImportsMap.set(modRefId, {
            ...shallowImports,
            initImportRegistryMap: new Map([[decorator, shallowImportedModule]]),
          });
        }
      });
    });
    return mergedShallowImportsMap;
  }

  protected async handleExtensions(
    mMetadataPerMod2: Map<ModRefId, MetadataPerMod2>,
    extensionCounters: ExtensionCounters,
  ) {
    const extensionContext = new ExtensionContext();
    const injectorPerApp = this.perAppService.reinitInjector([{ token: PerAppService, useValue: this.perAppService }]);

    for (const [, metadataPerMod2] of mMetadataPerMod2) {
      const { baseMeta, aOrderedExtensions } = this.overrideMetaBeforeExtensionHanling(
        metadataPerMod2.baseMeta,
        metadataPerMod2.aOrderedExtensions,
      );
      const injectorPerMod = injectorPerApp.resolveAndCreateChild(baseMeta.providersPerMod, 'Mod');
      const systemLogMediator = injectorPerMod.pull(SystemLogMediator) as SystemLogMediator;
      const { extensionProviders } = baseMeta;
      if (!extensionProviders.length) {
        systemLogMediator.skippingStartExtensions(this);
        continue;
      }
      const providers = this.getProvidersForExtensions(metadataPerMod2, extensionCounters, extensionContext);
      const injectorForExtensions = injectorPerMod.resolveAndCreateChild(providers, 'injectorOfExtensions');
      const extensionManager = injectorForExtensions.get(InternalExtensionManager) as InternalExtensionManager;

      systemLogMediator.startExtensions(this);
      this.decreaseExtensionsCounters(extensionCounters, extensionProviders);
      await this.handleExtensionsPerMod(baseMeta, aOrderedExtensions, extensionManager, systemLogMediator);
      this.logExtensionsStatistic(injectorPerApp, systemLogMediator);
    }
    await this.perAppHandling(mMetadataPerMod2, extensionContext);
  }

  protected async perAppHandling(
    mMetadataPerMod2: Map<ModRefId, MetadataPerMod2>,
    extensionContext: ExtensionContext,
  ) {
    for (const [ExtCls, mExtensions] of extensionContext.mExtensionPendingList) {
      for (const extension of mExtensions.values()) {
        try {
          await extension.stage1?.(true);
        } catch (err: any) {
          const groupName = getProviderName(ExtCls);
          throw new FailedCollectingMetadata(groupName, err);
        }
      }
    }

    for (const [modRefId, { baseMeta }] of mMetadataPerMod2) {
      try {
        this.overrideMetaAfterStage1(baseMeta.modRefId, baseMeta);
        baseMeta.initMeta.forEach((meta) => this.overrideMetaAfterStage1(baseMeta.modRefId, meta));
      } catch (err: any) {
        const debugModuleName = getDebugClassName(modRefId) || 'unknown';
        throw new FailedOverrideMetaAfterStage1(debugModuleName, err);
      }
    }

    // After the extensions have added new providers, injectorPerApp needs to be recreated one last time.
    this.perAppService.reinitInjector();
    this.perAppService.close();

    for (const [modRefId, { baseMeta }] of mMetadataPerMod2) {
      try {
        const injectorPerMod = await this.initModuleAndGetInjectorPerMod(baseMeta);
        this.moduleManager.setInjectorPerMod(modRefId, injectorPerMod);
      } catch (err: any) {
        const debugModuleName = getDebugClassName(modRefId) || 'unknown';
        throw new FailedCreateInjectorPerMod(debugModuleName, err);
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
          throw new FailedStage2(debugModuleName, ext.constructor.name, err);
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
          throw new FailedStage3(debugModuleName, ext.constructor.name, err);
        }
      }
    }
  }

  protected async initModuleAndGetInjectorPerMod(baseMeta: BaseMeta): Promise<Injector> {
    const Mod = getModule(baseMeta.modRefId);
    const extendedProvidersPerMod = [Mod, ...baseMeta.providersPerMod];
    const injectorPerApp = this.perAppService.injector;
    const injectorPerMod = injectorPerApp.resolveAndCreateChild(extendedProvidersPerMod, 'Mod');
    await (injectorPerMod.get(Mod) as Partial<OnModuleInit>).onModuleInit?.(); // Instantiate the class of the module and call the hook.
    return injectorPerMod;
  }

  /**
   * Note that this method is used for `@ditsmod/testing`.
   */
  protected getProvidersForExtensions(
    metadataPerMod2: MetadataPerMod2,
    extensionCounters: ExtensionCounters,
    extensionContext: ExtensionContext,
  ): Provider[] {
    return [
      InternalExtensionManager,
      { token: ExtensionManager, useToken: InternalExtensionManager },
      { token: ExtensionContext, useValue: extensionContext },
      { token: MetadataPerMod2, useValue: metadataPerMod2 },
      { token: ExtensionCounters, useValue: extensionCounters },
      { token: PROVIDERS_PER_APP, useValue: this.baseMeta.providersPerApp },
      ...metadataPerMod2.baseMeta.extensionProviders,
    ];
  }

  protected async handleExtensionsPerMod(
    baseMeta: BaseMeta,
    aOrderedExtensions: ExtensionClass[],
    extensionManager: InternalExtensionManager,
    systemLogMediator: SystemLogMediator,
  ) {
    systemLogMediator.sequenceOfExtensions(this, aOrderedExtensions);
    await extensionManager.internalStage1(baseMeta, aOrderedExtensions);
  }

  /**
   * This method is needed to be able to override the metadata during testing.
   *
   * See `TestAppInitializer` in `@ditsmod/testing` for more info.
   */
  protected overrideMetaBeforeExtensionHanling(baseMeta: BaseMeta, aOrderedExtensions: ExtensionClass[]) {
    return { baseMeta, aOrderedExtensions };
  }

  /**
   * This method is needed to be able to override the metadata during testing.
   *
   * See `TestAppInitializer` in `@ditsmod/testing` for more info.
   */
  protected overrideMetaAfterStage1(modRefId: ModRefId, providersOnly: ProvidersOnly): void {}

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
