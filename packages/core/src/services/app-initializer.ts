import { Injectable, InjectionToken, ReflectiveInjector } from '@ts-stack/di';

import { NormalizedModuleMetadata } from '../models/normalized-module-metadata';
import { ProvidersMetadata } from '../models/providers-metadata';
import { RootMetadata } from '../models/root-metadata';
import { ModuleFactory } from '../module-factory';
import { AppMetadataMap, ServiceProvider, Extension } from '../types/mix';
import { RequestListener } from '../types/server-options';
import { getDuplicates } from '../utils/get-duplicates';
import { getModuleName } from '../utils/get-module-name';
import { getTokensCollisions } from '../utils/get-tokens-collisions';
import { getUniqProviders } from '../utils/get-uniq-providers';
import { normalizeProviders } from '../utils/ng-utils';
import { pickProperties } from '../utils/pick-properties';
import { throwProvidersCollisionError } from '../utils/throw-providers-collision-error';
import { isRootModule } from '../utils/type-guards';
import { defaultProvidersPerApp } from './default-providers-per-app';
import { ExtensionsManager } from './extensions-manager';
import { ModuleManager } from './module-manager';
import { Counter } from './counter';
import { LogMediator } from './log-mediator';
import { LogManager } from './log-manager';
import { ImportsMap, MetadataPerMod1 } from '../types/metadata-per-mod';
import { ImportsResolver } from '../imports-resolver';
import { getTokens } from '../utils/get-tokens';
import { PreRouter } from './pre-router';
import { getModuleMetadata } from '../utils/get-module-metadata';

@Injectable()
export class AppInitializer {
  protected injectorPerApp: ReflectiveInjector;
  protected preRouter: PreRouter;
  protected meta: RootMetadata;
  protected logManager: LogManager;

  constructor(protected moduleManager: ModuleManager, protected logMediator: LogMediator) {}

  /**
   * _Note:_ after call this method, you need call `this.flush()`.
   */
  bootstrapProvidersPerApp() {
    const meta = this.moduleManager.getMetadata('root', true);
    this.mergeRootMetadata(meta);
    this.prepareProvidersPerApp(meta, this.moduleManager);
    this.addDefaultProvidersPerApp();
    this.createInjectorAndSetLog();
  }

  /**
   * Merge AppModule metadata with default metadata for root module.
   *
   * @param meta Metadata for the root module.
   */
  protected mergeRootMetadata(meta: NormalizedModuleMetadata): void {
    this.meta = new RootMetadata();
    pickProperties(this.meta, meta);
    const serverMetadata = getModuleMetadata(meta.module, true)! as RootMetadata;
    this.meta.prefixPerApp = serverMetadata.prefixPerApp;
  }

  /**
   * 1. checks collisions for non-root exported providers per app;
   * 2. then merges these providers with providers that declared on root module.
   *
   * @param meta root metadata.
   */
  protected prepareProvidersPerApp(meta: NormalizedModuleMetadata, moduleManager: ModuleManager) {
    // Here we work only with providers declared at the application level.

    const exportedProviders = this.collectProvidersPerApp(meta, moduleManager);
    const rootTokens = getTokens(this.meta.providersPerApp);
    const exportedNormProviders = normalizeProviders(exportedProviders);
    const exportedTokens = exportedNormProviders.map((np) => np.provide);
    const exportedMultiTokens = exportedNormProviders.filter((np) => np.multi).map((np) => np.provide);
    const defaultTokens = getTokens(defaultProvidersPerApp);
    const mergedTokens = [...exportedTokens, ...defaultTokens];
    let exportedTokensDuplicates = getDuplicates(mergedTokens).filter(
      (d) => !rootTokens.includes(d) && !exportedMultiTokens.includes(d)
    );
    const mergedProviders = [...defaultProvidersPerApp, ...exportedProviders];
    exportedTokensDuplicates = getTokensCollisions(exportedTokensDuplicates, mergedProviders);
    if (exportedTokensDuplicates.length) {
      const moduleName = getModuleName(meta.module);
      throwProvidersCollisionError(moduleName, exportedTokensDuplicates);
    }
    this.meta.providersPerApp.unshift(...exportedProviders);
  }

  /**
   * Recursively collects per app providers from non-root modules.
   */
  protected collectProvidersPerApp(meta1: NormalizedModuleMetadata, moduleManager: ModuleManager) {
    const modules = [
      ...meta1.importsModules,
      ...meta1.importsWithParams,
      ...meta1.exportsModules,
      ...meta1.exportsWithParams,
    ];
    const providersPerApp: ServiceProvider[] = [];
    // Removes duplicate (because of reexports modules)
    new Set(modules).forEach((mod) => {
      const meta2 = moduleManager.getMetadata(mod, true);
      providersPerApp.push(...this.collectProvidersPerApp(meta2, moduleManager));
    });
    const currProvidersPerApp = isRootModule(meta1) ? [] : meta1.providersPerApp;

    return [...providersPerApp, ...getUniqProviders(currProvidersPerApp)];
  }

  async bootstrapModulesAndExtensions() {
    const appMetadataMap = this.bootstrapModuleFactory(this.moduleManager);
    const importsResolver = new ImportsResolver(this.moduleManager, appMetadataMap, this.meta.providersPerApp);
    importsResolver.resolve();
    await this.handleExtensions(appMetadataMap);
    this.preRouter = this.injectorPerApp.get(PreRouter) as PreRouter;
    return this.meta;
  }

  flushLogs() {
    this.logMediator.bufferLogs = false;
    this.logMediator.flush();
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
      { provide: RootMetadata, useValue: this.meta },
      { provide: ModuleManager, useValue: this.moduleManager },
      { provide: LogManager, useValue: this.logManager },
      { provide: AppInitializer, useValue: this }
    );
  }

  /**
   * Creates injector per the application and sets log.
   */
  protected createInjectorAndSetLog() {
    this.injectorPerApp = ReflectiveInjector.resolveAndCreate(this.meta.providersPerApp);
    const log = this.injectorPerApp.get(LogMediator) as LogMediator;
    log.bufferLogs = true;
    this.logMediator = log;
  }

  protected bootstrapModuleFactory(moduleManager: ModuleManager) {
    const globalProviders = this.getGlobalProviders(moduleManager);
    this.logMediator.printGlobalProviders('trace', { className: this.constructor.name }, globalProviders);
    const moduleFactory = this.injectorPerApp.resolveAndInstantiate(ModuleFactory) as ModuleFactory;
    const appModule = moduleManager.getMetadata('root', true).module;
    return moduleFactory.bootstrap(globalProviders, '', appModule, moduleManager);
  }

  protected getGlobalProviders(moduleManager: ModuleManager) {
    const providers = new ProvidersMetadata();
    const importedProviders = new ImportsMap();
    const globalProviders: ProvidersMetadata & ImportsMap = { ...providers, ...importedProviders };
    globalProviders.providersPerApp = this.meta.providersPerApp;
    const moduleFactory = this.injectorPerApp.resolveAndInstantiate(ModuleFactory) as ModuleFactory;
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
    this.createInjectorAndSetLog();
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
        this.logMediator.startExtensionsGroupInit('debug', { className: this.constructor.name }, moduleName, beforeToken);
        await extensionsManager.init(beforeToken);
        this.logMediator.finishExtensionsGroupInit('debug', { className: this.constructor.name }, moduleName, beforeToken);

        this.logMediator.startExtensionsGroupInit('debug', { className: this.constructor.name }, moduleName, groupToken);
        await extensionsManager.init(groupToken);
        this.logMediator.finishExtensionsGroupInit('debug', { className: this.constructor.name }, moduleName, groupToken);
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
