import { InjectionToken } from '@ts-stack/di';

import { EXTENSIONS_COUNTERS } from './constans';
import { ImportsResolver } from './imports-resolver';
import { NormalizedModuleMetadata } from './models/normalized-module-metadata';
import { RootMetadata } from './models/root-metadata';
import { ModuleFactory } from './module-factory';
import { Counter } from './services/counter';
import { defaultProvidersPerApp } from './services/default-providers-per-app';
import { ExtensionsContext } from './services/extensions-context';
import { ExtensionsManager } from './services/extensions-manager';
import { LogMediator } from './services/log-mediator';
import { ModuleManager } from './services/module-manager';
import { PerAppService } from './services/per-app.service';
import { PreRouter } from './services/pre-router';
import { LoggerConfig } from './types/logger';
import { MetadataPerMod1 } from './types/metadata-per-mod';
import { Extension, ModuleType, ModuleWithParams, ServiceProvider } from './types/mix';
import { RequestListener } from './types/server-options';
import { getCollisions } from './utils/get-collisions';
import { getDuplicates } from './utils/get-duplicates';
import { getLastProviders } from './utils/get-last-providers';
import { getModule } from './utils/get-module';
import { getModuleName } from './utils/get-module-name';
import { getProvidersTargets, getToken, getTokens } from './utils/get-tokens';
import { normalizeProviders } from './utils/ng-utils';
import { throwProvidersCollisionError } from './utils/throw-providers-collision-error';
import { isMultiProvider, isRootModule } from './utils/type-guards';

export class AppInitializer {
  protected perAppService = new PerAppService();
  protected preRouter: PreRouter;
  protected meta: NormalizedModuleMetadata;
  protected unfinishedScanModules = new Set<ModuleType | ModuleWithParams>();

  constructor(
    protected rootMeta: RootMetadata,
    protected moduleManager: ModuleManager,
    public logMediator: LogMediator
  ) {}

  /**
   * _Note:_ after call this method, you need call `this.flush()`.
   */
  bootstrapProvidersPerApp() {
    this.meta = this.moduleManager.getMetadata('root', true);
    this.perAppService.removeProviders();
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
    const exportedTokens = exportedNormProviders.map((np) => np.provide);
    const exportedMultiTokens = exportedNormProviders.filter((np) => np.multi).map((np) => np.provide);
    const resolvedTokens = this.meta.resolvedCollisionsPerApp.map(([token]) => token);
    const defaultTokens = getTokens(defaultProvidersPerApp);
    const rootTokens = getTokens(this.meta.providersPerApp);
    const mergedTokens = [...exportedTokens, ...defaultTokens];
    const exportedTokensDuplicates = getDuplicates(mergedTokens).filter(
      (d) => ![...resolvedTokens, ...rootTokens, ...exportedMultiTokens].includes(d)
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
      ...meta1.importsModules,
      ...meta1.importsWithParams,
      ...meta1.exportsModules,
      ...meta1.exportsWithParams,
    ];
    const providersPerApp: ServiceProvider[] = [];
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
    const resolvedProviders: ServiceProvider[] = [];
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
      this.logMediator
    );
    const mExtensionsCounters = importsResolver.resolve();
    const aMetadataPerMod1 = [...appMetadataMap].map(([, metadataPerMod1]) => metadataPerMod1);
    await this.handleExtensions(aMetadataPerMod1, mExtensionsCounters);
    this.preRouter = this.perAppService.injector.get(PreRouter) as PreRouter;
    return appMetadataMap;
  }

  async reinit(autocommit: boolean = true): Promise<void | Error> {
    LogMediator.bufferLogs = true;
    LogMediator.buffer = [];
    const previousLogger = this.logMediator.logger;
    this.logMediator.startReinitApp(this);
    // Before init new logger, works previous logger.
    try {
      this.bootstrapProvidersPerApp();
    } catch (err) {
      this.logMediator.logger = previousLogger;
      LogMediator.bufferLogs = false;
      this.logMediator.flush();
      return this.handleReinitError(err);
    }
    // After init new logger, works new logger.
    try {
      await this.bootstrapModulesAndExtensions();
      if (autocommit) {
        this.moduleManager.commit();
      } else {
        this.logMediator.skippingAutocommitModulesConfig(this);
      }
      this.logMediator.finishReinitApp(this);
    } catch (err) {
      return this.handleReinitError(err);
    } finally {
      LogMediator.bufferLogs = false;
      this.logMediator.flush();
    }
  }

  protected async handleReinitError(err: unknown) {
    this.logMediator.printReinitError(this, err);
    this.logMediator.startRollbackModuleConfigChanges(this);
    this.moduleManager.rollback();
    this.bootstrapProvidersPerApp();
    await this.bootstrapModulesAndExtensions();
    this.logMediator.successfulRollbackModuleConfigChanges(this);
    return err as Error;
  }

  protected addDefaultProvidersPerApp() {
    this.meta.providersPerApp.unshift(
      ...defaultProvidersPerApp,
      { provide: RootMetadata, useValue: this.rootMeta },
      { provide: ModuleManager, useValue: this.moduleManager },
      { provide: AppInitializer, useValue: this }
    );
  }

  /**
   * Creates injector per the application and sets log.
   */
  protected createInjectorAndSetLogMediator() {
    const injectorPerApp = this.perAppService.reinitInjector(this.meta.providersPerApp);
    const logMediator = injectorPerApp.get(LogMediator) as LogMediator;
    this.logMediator = logMediator;
  }

  protected bootstrapModuleFactory(moduleManager: ModuleManager) {
    const moduleFactory1 = new ModuleFactory();
    const globalProviders = moduleFactory1.exportGlobalProviders(moduleManager, this.meta.providersPerApp);
    this.logMediator.printGlobalProviders(this, globalProviders);
    const moduleFactory2 = new ModuleFactory();
    const appModule = moduleManager.getMetadata('root', true).module;
    return moduleFactory2.bootstrap(
      this.meta.providersPerApp,
      globalProviders,
      '',
      appModule,
      moduleManager,
      new Set()
    );
  }

  protected async handleExtensions(
    aMetadataPerMod1: MetadataPerMod1[],
    mExtensionsCounters: Map<ServiceProvider, number>
  ) {
    const extensionsContext = new ExtensionsContext();
    const injectorPerApp = this.perAppService.injector.resolveAndCreateChild([
      { provide: PerAppService, useValue: this.perAppService },
    ]);
    for (let i = 0; i < aMetadataPerMod1.length; i++) {
      const metadataPerMod1 = aMetadataPerMod1[i];
      const { extensionsProviders, providersPerMod, name: moduleName, module } = metadataPerMod1.meta;
      const mod = getModule(module);
      const injectorPerMod = injectorPerApp.resolveAndCreateChild([mod, LogMediator, ...providersPerMod]);
      injectorPerMod.get(mod); // Call module constructor.
      const logMediator = injectorPerMod.get(LogMediator) as LogMediator;
      const loggerConfig = injectorPerMod.get(LoggerConfig, new LoggerConfig()) as LoggerConfig;
      logMediator.logger.setLevel(loggerConfig.level);
      logMediator.startExtensionsModuleInit(this);
      this.decreaseExtensionsCounters(mExtensionsCounters, extensionsProviders);
      const injectorForExtensions = injectorPerMod.resolveAndCreateChild([
        ExtensionsManager,
        { provide: ExtensionsContext, useValue: extensionsContext },
        { provide: MetadataPerMod1, useValue: metadataPerMod1 },
        { provide: EXTENSIONS_COUNTERS, useValue: mExtensionsCounters },
        ...extensionsProviders,
      ]);
      const extensionTokens = new Set<InjectionToken<Extension<any>[]>>();
      const beforeTokens = new Set<string>();
      for (const token of getTokens(extensionsProviders)) {
        if (token instanceof InjectionToken) {
          extensionTokens.add(token);
        } else {
          beforeTokens.add(token);
        }
      }
      const extensionsManager = injectorForExtensions.get(ExtensionsManager) as ExtensionsManager;
      for (const groupToken of extensionTokens) {
        extensionsManager.moduleName = moduleName;
        extensionsManager.beforeTokens = beforeTokens;
        await extensionsManager.init(groupToken);
      }
      this.logExtensionsStatistic(logMediator);
    }
  }

  protected decreaseExtensionsCounters(
    mExtensionsCounters: Map<ServiceProvider, number>,
    extensions: ServiceProvider[]
  ) {
    const uniqTargets = new Set<ServiceProvider>(getProvidersTargets(extensions));

    uniqTargets.forEach((target) => {
      const counter = mExtensionsCounters.get(target)!;
      mExtensionsCounters.set(target, counter - 1);
    });
  }

  protected logExtensionsStatistic(logMediator: LogMediator) {
    const counter = this.perAppService.injector.get(Counter) as Counter;
    const extensions = counter.getInitedExtensions();
    const names = Array.from(extensions)
      .map((e) => e.constructor.name)
      .join(', ');
    logMediator.totalInitedExtensions(this, extensions.size, names);
    counter.resetInitedExtensionsSet();
  }

  requestListener: RequestListener = async (nodeReq, nodeRes) => {
    await this.preRouter.requestListener(nodeReq, nodeRes);
  };
}
