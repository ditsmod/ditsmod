import { InjectionToken, ReflectiveInjector } from '@ts-stack/di';

import { ImportsResolver } from '../imports-resolver';
import { NormalizedModuleMetadata } from '../models/normalized-module-metadata';
import { RootMetadata } from '../models/root-metadata';
import { ModuleFactory } from '../module-factory';
import { MetadataPerMod1 } from '../types/metadata-per-mod';
import { Extension, ModuleType, ModuleWithParams, ServiceProvider } from '../types/mix';
import { RequestListener } from '../types/server-options';
import { getDuplicates } from '../utils/get-duplicates';
import { getModuleName } from '../utils/get-module-name';
import { getProvidersTargets, getToken, getTokens } from '../utils/get-tokens';
import { getCollisions } from '../utils/get-collisions';
import { normalizeProviders } from '../utils/ng-utils';
import { throwProvidersCollisionError } from '../utils/throw-providers-collision-error';
import { isMultiProvider, isRootModule } from '../utils/type-guards';
import { Counter } from './counter';
import { defaultProvidersPerApp } from './default-providers-per-app';
import { ExtensionsManager } from './extensions-manager';
import { LogManager } from './log-manager';
import { LogMediator } from './log-mediator';
import { ModuleManager } from './module-manager';
import { PreRouter } from './pre-router';
import { getLastProviders } from '../utils/get-last-providers';
import { ExtensionsContext } from './extensions-context';
import { InjectorPerApp } from '../models/injector-per-app';
import { EXTENSIONS_COUNTERS } from '../constans';
import { Logger, LoggerConfig } from '../types/logger';
import { getModule } from '../utils/get-module';

export class AppInitializer {
  protected injectorPerApp: ReflectiveInjector;
  protected preRouter: PreRouter;
  protected meta: NormalizedModuleMetadata;
  protected logManager: LogManager;
  protected unfinishedScanModules = new Set<ModuleType | ModuleWithParams>();

  constructor(
    protected rootMeta: RootMetadata,
    protected moduleManager: ModuleManager,
    protected logMediator: LogMediator
  ) {}

  /**
   * _Note:_ after call this method, you need call `this.flush()`.
   */
  bootstrapProvidersPerApp() {
    this.meta = this.moduleManager.getMetadata('root', true);
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
    this.preRouter = this.injectorPerApp.get(PreRouter) as PreRouter;
    return appMetadataMap;
  }

  async reinit(autocommit: boolean = true): Promise<void | Error> {
    const previousLogger = this.logMediator.logger;
    this.logMediator.startReinitApp(this);
    // Before init new logger, works previous logger.
    try {
      this.bootstrapProvidersPerApp();
    } catch (err) {
      this.logMediator.logger = previousLogger;
      this.logMediator.bufferLogs = false;
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
      this.logMediator.bufferLogs = false;
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
    this.logManager = this.logMediator.getLogManager();
    this.meta.providersPerApp.unshift(
      ...defaultProvidersPerApp,
      { provide: RootMetadata, useValue: this.rootMeta },
      { provide: ModuleManager, useValue: this.moduleManager },
      { provide: LogManager, useValue: this.logManager },
      { provide: AppInitializer, useValue: this }
    );
  }

  /**
   * Creates injector per the application and sets log.
   */
  protected createInjectorAndSetLogMediator() {
    this.injectorPerApp = ReflectiveInjector.resolveAndCreate(this.meta.providersPerApp);
    const log = this.injectorPerApp.get(LogMediator) as LogMediator;
    log.bufferLogs = true;
    this.logMediator = log;
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
    const len = aMetadataPerMod1.length;
    for (let i = 0; i < len; i++) {
      const metadataPerMod1 = aMetadataPerMod1[i];
      const { extensionsProviders, providersPerMod, name: moduleName, module } = metadataPerMod1.meta;
      const mod = getModule(module);
      const injectorPerMod = this.injectorPerApp.resolveAndCreateChild([mod, ...providersPerMod]);
      injectorPerMod.get(mod); // Call module constructor.
      const loggerConfig = injectorPerMod.get(LoggerConfig) as LoggerConfig;
      this.logMediator.level = loggerConfig.level;
      this.logMediator.logger = injectorPerMod.get(Logger) as Logger;
      this.logMediator.startExtensionsModuleInit(this, moduleName);
      this.decreaseExtensionsCounters(mExtensionsCounters, extensionsProviders);
      const injectorForExtensions = injectorPerMod.resolveAndCreateChild([
        ExtensionsManager,
        { provide: ExtensionsContext, useValue: extensionsContext },
        { provide: MetadataPerMod1, useValue: metadataPerMod1 },
        { provide: InjectorPerApp, useValue: this.injectorPerApp },
        { provide: EXTENSIONS_COUNTERS, useValue: mExtensionsCounters },
        ...extensionsProviders,
      ]);
      const extensionTokens: InjectionToken<Extension<any>[]>[] = [];
      const beforeTokens: string[] = [];
      for(const token of getTokens(extensionsProviders)) {
        if (token instanceof InjectionToken) {
          extensionTokens.push(token);
        } else {
          beforeTokens.push(token);
        }
      }
      const extensionsManager = injectorForExtensions.get(ExtensionsManager) as ExtensionsManager;
      for (const groupToken of extensionTokens) {
        extensionsManager.initService(moduleName, beforeTokens);
        await extensionsManager.startChainInit(groupToken);
      }
      this.logExtensionsStatistic(moduleName);
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

  protected logExtensionsStatistic(moduleName: string) {
    const counter = this.injectorPerApp.get(Counter) as Counter;
    const extensions = counter.getInitedExtensions();
    const names = Array.from(extensions)
      .map((e) => e.constructor.name)
      .join(', ');
    this.logMediator.totalInitedExtensions(this, moduleName, extensions.size, names);
    counter.resetInitedExtensionsSet();
  }

  requestListener: RequestListener = async (nodeReq, nodeRes) => {
    await this.preRouter.requestListener(nodeReq, nodeRes);
  };

  flushLogs() {
    this.logMediator.bufferLogs = false;
    this.logMediator.flush();
  }

  serverListen() {
    const { listenOptions, serverName } = this.rootMeta;
    this.logMediator.serverListen(this, serverName, listenOptions.host!, listenOptions.port!);
  }
}
