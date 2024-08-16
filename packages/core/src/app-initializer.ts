import { InjectionToken, Injector } from '#di';
import { EXTENSIONS_COUNTERS } from './constans.js';
import { ImportsResolver } from './imports-resolver.js';
import { Logger } from '#logger/logger.js';
import { SystemErrorMediator } from '#error/system-error-mediator.js';
import { LogMediator } from '#logger/log-mediator.js';
import { SystemLogMediator } from '#logger/system-log-mediator.js';
import { NormalizedModuleMetadata } from './types/normalized-module-metadata.js';
import { AppOptions } from './types/app-options.js';
import { ModuleFactory } from './module-factory.js';
import { Counter } from './services/counter.js';
import { defaultProvidersPerApp } from './default-providers-per-app.js';
import { ExtensionsContext } from './services/extensions-context.js';
import { ExtensionsManager } from './services/extensions-manager.js';
import { ModuleManager } from './services/module-manager.js';
import { PerAppService } from './services/per-app.service.js';
import { PreRouter } from './services/pre-router.js';
import { MetadataPerMod1 } from './types/metadata-per-mod.js';
import { ModuleType, ModuleWithParams, Provider } from './types/mix.js';
import { Extension } from '#types/extension-types.js';
import { RequestListener } from './types/server-options.js';
import { getCollisions } from './utils/get-collisions.js';
import { getDuplicates } from './utils/get-duplicates.js';
import { getLastProviders } from './utils/get-last-providers.js';
import { getModuleName } from './utils/get-module-name.js';
import { getProvidersTargets, getToken, getTokens } from './utils/get-tokens.js';
import { normalizeProviders } from './utils/ng-utils.js';
import { throwProvidersCollisionError } from './utils/throw-providers-collision-error.js';
import { isMultiProvider, isNormRootModule } from './utils/type-guards.js';

export class AppInitializer {
  protected perAppService = new PerAppService();
  protected preRouter: PreRouter;
  protected meta: NormalizedModuleMetadata;
  protected unfinishedScanModules = new Set<ModuleType | ModuleWithParams>();

  constructor(
    protected appOptions: AppOptions,
    protected moduleManager: ModuleManager,
    public systemLogMediator: SystemLogMediator,
  ) {}

  /**
   * _Note:_ after call this method, you need call `this.flush()`.
   */
  bootstrapProvidersPerApp() {
    this.meta = this.moduleManager.getMetadata('root', true);
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
    const modules = [
      ...meta1.appendsWithParams,
      ...meta1.importsModules,
      ...meta1.importsWithParams,
      ...meta1.exportsModules,
      ...meta1.exportsWithParams,
    ];
    const providersPerApp: Provider[] = [];
    // Removes duplicate (because of reexports modules)
    for (const mod of new Set(modules)) {
      if (this.unfinishedScanModules.has(mod)) {
        continue;
      }
      const meta2 = this.moduleManager.getMetadata(mod, true);
      this.unfinishedScanModules.add(mod);
      providersPerApp.push(...this.collectProvidersPerApp(meta2));
      this.unfinishedScanModules.delete(mod);
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
      const moduleName = getModuleName(module);
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
    const mExtensionsCounters = importsResolver.resolve();
    const aMetadataPerMod1 = [...appMetadataMap].map(([, metadataPerMod1]) => metadataPerMod1);
    await this.handleExtensions(aMetadataPerMod1, mExtensionsCounters);
    this.systemLogMediator = this.perAppService.injector.get(SystemLogMediator) as SystemLogMediator;
    this.preRouter = this.perAppService.injector.get(PreRouter) as PreRouter;
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
    const appModule = moduleManager.getMetadata('root', true).module;
    return moduleFactory2.bootstrap(
      this.meta.providersPerApp,
      globalProviders,
      '',
      appModule,
      moduleManager,
      new Set(),
    );
  }

  protected async handleExtensions(aMetadataPerMod1: MetadataPerMod1[], mExtensionsCounters: Map<Provider, number>) {
    const extensionsContext = new ExtensionsContext();
    const injectorPerApp = this.perAppService.injector.resolveAndCreateChild([
      { token: PerAppService, useValue: this.perAppService },
    ]);

    for (const metadataPerMod1 of aMetadataPerMod1) {
      const preparedMetadataPerMod1 = this.prepareMetadataPerMod1(metadataPerMod1);
      const injectorPerMod = injectorPerApp.resolveAndCreateChild(preparedMetadataPerMod1.meta.providersPerMod);
      injectorPerMod.pull(Logger);
      const systemLogMediator = injectorPerMod.pull(SystemLogMediator) as SystemLogMediator;
      const { extensionsProviders } = preparedMetadataPerMod1.meta;
      if (!extensionsProviders.length) {
        systemLogMediator.skippingStartExtensions(this);
        continue;
      }
      const injectorForExtensions = this.getInjectorForExtensions(
        preparedMetadataPerMod1,
        mExtensionsCounters,
        extensionsContext,
        injectorPerMod,
      );
      const extensionsManager = injectorForExtensions.get(ExtensionsManager) as ExtensionsManager;

      systemLogMediator.startExtensions(this);
      this.decreaseExtensionsCounters(mExtensionsCounters, extensionsProviders);
      await this.handleExtensionsPerMod(preparedMetadataPerMod1, extensionsManager);
      this.logExtensionsStatistic(injectorPerApp, systemLogMediator);
    }
  }

  protected getInjectorForExtensions(
    metadataPerMod1: MetadataPerMod1,
    mExtensionsCounters: Map<Provider, number>,
    extensionsContext: ExtensionsContext,
    injectorPerMod: Injector,
  ) {
    return injectorPerMod.resolveAndCreateChild([
      ExtensionsManager,
      { token: ExtensionsContext, useValue: extensionsContext },
      { token: MetadataPerMod1, useValue: metadataPerMod1 },
      { token: EXTENSIONS_COUNTERS, useValue: mExtensionsCounters },
      ...metadataPerMod1.meta.extensionsProviders,
    ]);
  }

  protected async handleExtensionsPerMod(metadataPerMod1: MetadataPerMod1, extensionsManager: ExtensionsManager) {
    const { extensionsProviders, name: moduleName } = metadataPerMod1.meta;
    const extensionTokens = new Set<InjectionToken<Extension<any>[]>>();
    const beforeTokens = new Set<string>();
    for (const token of getTokens(extensionsProviders)) {
      if (token instanceof InjectionToken) {
        extensionTokens.add(token);
      } else {
        beforeTokens.add(token);
      }
    }
    for (const groupToken of extensionTokens) {
      extensionsManager.moduleName = moduleName;
      extensionsManager.beforeTokens = beforeTokens;
      await extensionsManager.init(groupToken);
    }
  }

  /**
   * This method is needed to be able to forcibly change the metadata (for example, during testing).
   *
   * See `TestAppInitializer` in `@ditsmod/testing` for more info.
   */
  protected prepareMetadataPerMod1(metadataPerMod1: MetadataPerMod1) {
    return metadataPerMod1;
  }

  protected decreaseExtensionsCounters(mExtensionsCounters: Map<Provider, number>, extensions: Provider[]) {
    const uniqTargets = new Set<Provider>(getProvidersTargets(extensions));

    uniqTargets.forEach((target) => {
      const counter = mExtensionsCounters.get(target)!;
      mExtensionsCounters.set(target, counter - 1);
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
