import { InjectionToken, ReflectiveInjector } from '@ts-stack/di';

import { ImportsResolver } from '../imports-resolver';
import { NormalizedModuleMetadata } from '../models/normalized-module-metadata';
import { ProvidersMetadata } from '../models/providers-metadata';
import { RootMetadata } from '../models/root-metadata';
import { ModuleFactory } from '../module-factory';
import { ImportsMap, MetadataPerMod1 } from '../types/metadata-per-mod';
import { AppMetadataMap, Extension, ModuleType, ModuleWithParams, ServiceProvider } from '../types/mix';
import { RequestListener } from '../types/server-options';
import { getDuplicates } from '../utils/get-duplicates';
import { getModuleName } from '../utils/get-module-name';
import { getToken, getTokens } from '../utils/get-tokens';
import { getCollisions } from '../utils/get-collisions';
import { normalizeProviders } from '../utils/ng-utils';
import { throwProvidersCollisionError } from '../utils/throw-providers-collision-error';
import { isRootModule } from '../utils/type-guards';
import { Counter } from './counter';
import { defaultProvidersPerApp } from './default-providers-per-app';
import { ExtensionsManager } from './extensions-manager';
import { LogManager } from './log-manager';
import { FilterConfig, LogMediator } from './log-mediator';
import { ModuleManager } from './module-manager';
import { PreRouter } from './pre-router';
import { getLastProviders } from '../utils/get-last-providers';

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
   * 2. then merges these providers with providers that declared on root module.
   *
   * @param meta root metadata.
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
    let exportedTokensDuplicates = getDuplicates(mergedTokens).filter(
      (d) => !resolvedTokens.includes(d) && !rootTokens.includes(d) && !exportedMultiTokens.includes(d)
    );
    const mergedProviders = [...defaultProvidersPerApp, ...exportedProviders];
    const collisions = getCollisions(exportedTokensDuplicates, mergedProviders);
    if (collisions.length) {
      const currentModuleName = getModuleName(this.meta.module);
      const modulesNames = this.findModulesCausesCollisions(collisions);
      throwProvidersCollisionError(currentModuleName, collisions, modulesNames);
    }
    exportedProviders.push(...this.getResolvedCollisionsPerApp());
    this.meta.providersPerApp.unshift(...exportedProviders);
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
      resolvedProviders.push(provider);
    });

    return resolvedProviders;
  }

  protected findModulesCausesCollisions(collisions: any[]) {
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

  async bootstrapModulesAndExtensions() {
    const appMetadataMap = this.bootstrapModuleFactory(this.moduleManager);
    const importsResolver = new ImportsResolver(this.moduleManager, appMetadataMap, this.meta.providersPerApp);
    importsResolver.resolve();
    await this.handleExtensions(appMetadataMap);
    this.preRouter = this.injectorPerApp.get(PreRouter) as PreRouter;
    return appMetadataMap;
  }

  flushLogs() {
    this.logMediator.bufferLogs = false;
    this.logMediator.flush();
  }

  serverListen(host: string, serverName: string, port: number) {
    const filterConfig: FilterConfig = { className: this.constructor.name };
    this.logMediator.serverListen('info', filterConfig, serverName, host, port);
  }

  async reinit(autocommit: boolean = true): Promise<void | Error> {
    const previousLogger = this.logMediator.logger;
    this.logMediator.startReinitApp('debug');
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
        this.logMediator.skippingAutocommitModulesConfig('warn');
      }
      this.logMediator.finishReinitApp('debug');
    } catch (err) {
      return this.handleReinitError(err);
    } finally {
      this.logMediator.bufferLogs = false;
      this.logMediator.flush();
    }
  }

  requestListener: RequestListener = async (nodeReq, nodeRes) => {
    await this.preRouter.requestListener(nodeReq, nodeRes);
  };

  protected async handleReinitError(err: unknown) {
    this.logMediator.printReinitError('error', { className: this.constructor.name }, err);
    this.logMediator.startRollbackModuleConfigChanges('debug');
    this.moduleManager.rollback();
    this.bootstrapProvidersPerApp();
    await this.bootstrapModulesAndExtensions();
    this.logMediator.successfulRollbackModuleConfigChanges('debug');
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
    const globalProviders = this.getGlobalProviders(moduleManager);
    this.logMediator.printGlobalProviders('trace', { className: this.constructor.name }, globalProviders);
    const moduleFactory = new ModuleFactory();
    const appModule = moduleManager.getMetadata('root', true).module;
    return moduleFactory.bootstrap(globalProviders, '', appModule, moduleManager, new Set());
  }

  protected getGlobalProviders(moduleManager: ModuleManager) {
    const providers = new ProvidersMetadata();
    const importedProviders = new ImportsMap();
    const globalProviders: ProvidersMetadata & ImportsMap = { ...providers, ...importedProviders };
    globalProviders.providersPerApp = this.meta.providersPerApp;
    const moduleFactory = new ModuleFactory();
    const {
      // Don't autoformat this
      providersPerMod,
      providersPerRou,
      providersPerReq,
      importedPerMod,
      importedPerRou,
      importedPerReq,
      importedExtensions,
    } = moduleFactory.exportGlobalProviders(moduleManager, globalProviders);

    globalProviders.providersPerMod = providersPerMod.slice();
    globalProviders.providersPerRou = providersPerRou.slice();
    globalProviders.providersPerReq = providersPerReq.slice();
    globalProviders.importedPerMod = importedPerMod;
    globalProviders.importedPerRou = importedPerRou;
    globalProviders.importedPerReq = importedPerReq;
    globalProviders.importedExtensions = importedExtensions;
    return globalProviders;
  }

  protected async handleExtensions(appMetadataMap: AppMetadataMap) {
    this.createInjectorAndSetLogMediator();
    for (const [, metadataPerMod1] of appMetadataMap) {
      const initedExtensionsGroups = new Set<InjectionToken<Extension<any>[]>>();
      const { extensions, providersPerMod, name: moduleName } = metadataPerMod1.meta;
      const injectorPerMod = this.injectorPerApp.resolveAndCreateChild(providersPerMod);
      const injectorForExtensions = injectorPerMod.resolveAndCreateChild([
        ExtensionsManager,
        { provide: MetadataPerMod1, useValue: metadataPerMod1 },
        ...extensions,
      ]);
      const extensionsManager = injectorForExtensions.get(ExtensionsManager) as ExtensionsManager;
      const extensionTokens = getTokens(extensions).filter((token) => token instanceof InjectionToken);
      for (const groupToken of extensionTokens) {
        if (initedExtensionsGroups.has(groupToken)) {
          continue;
        }
        const beforeToken = `BEFORE ${groupToken}`;
        this.logMediator.startExtensionsGroupInit(
          'debug',
          { className: this.constructor.name },
          moduleName,
          beforeToken
        );
        await extensionsManager.init(beforeToken);
        this.logMediator.finishExtensionsGroupInit(
          'debug',
          { className: this.constructor.name },
          moduleName,
          beforeToken
        );

        this.logMediator.startExtensionsGroupInit(
          'debug',
          { className: this.constructor.name },
          moduleName,
          groupToken
        );
        await extensionsManager.init(groupToken);
        this.logMediator.finishExtensionsGroupInit(
          'debug',
          { className: this.constructor.name },
          moduleName,
          groupToken
        );
        initedExtensionsGroups.add(groupToken);
      }
      extensionsManager.clearUnfinishedInitExtensions();
      this.logExtensionsStatistic();
    }
  }

  protected logExtensionsStatistic() {
    const counter = this.injectorPerApp.get(Counter) as Counter;
    const extensions = counter.getInitedExtensions();
    const names = Array.from(extensions)
      .map((e) => e.constructor.name)
      .join(', ');
    this.logMediator.totalInitedExtensions('debug', { className: this.constructor.name }, extensions.size, names);
    counter.resetInitedExtensionsSet();
  }
}
