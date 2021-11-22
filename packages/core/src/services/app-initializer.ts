import { Injectable, InjectionToken, ReflectiveInjector } from '@ts-stack/di';

import { NormalizedModuleMetadata } from '../models/normalized-module-metadata';
import { ProvidersMetadata } from '../models/providers-metadata';
import { RootMetadata } from '../models/root-metadata';
import { ModuleFactory } from '../module-factory';
import { AppMetadataMap, ModuleType, ServiceProvider, Extension } from '../types/mix';
import { RequestListener } from '../types/server-options';
import { getDuplicates } from '../utils/get-duplicates';
import { getModuleMetadata } from '../utils/get-module-metadata';
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
import { PreRouterExtension } from '../extensions/pre-router.extension';
import { Counter } from './counter';
import { APP_METADATA_MAP } from '../constans';
import { Log } from './log';
import { LogManager } from './log-manager';
import { ImportsMap } from '../types/metadata-per-mod';
import { ImportsResolver } from '../imports-resolver';
import { getTokens } from '../utils/get-tokens';

@Injectable()
export class AppInitializer {
  protected injectorPerApp: ReflectiveInjector;
  protected preRouter: PreRouterExtension;
  protected meta: RootMetadata;
  protected logManager: LogManager;

  constructor(protected moduleManager: ModuleManager, protected log: Log) {}

  /**
   * _Note:_ after call this method, you need call `this.flush()`.
   */
  bootstrapProvidersPerApp() {
    const meta = this.moduleManager.getMetadata('root', true);
    this.mergeMetadata(meta.module as ModuleType);
    this.prepareProvidersPerApp(meta, this.moduleManager);
    this.addDefaultProvidersPerApp();
    this.createInjectorAndSetLog();
  }

  async bootstrapModulesAndExtensions() {
    const appMetadataMap = this.bootstrapModuleFactory(this.moduleManager);
    const importsResolver = new ImportsResolver(this.moduleManager, appMetadataMap);
    importsResolver.resolve();
    await this.handleExtensions(appMetadataMap);
    this.preRouter = this.injectorPerApp.get(PreRouterExtension) as PreRouterExtension;
    return this.meta;
  }

  flushLogs() {
    this.log.bufferLogs = false;
    this.log.flush();
  }

  async reinit(autocommit: boolean = true): Promise<void | Error> {
    const previousLogger = this.log.logger;
    this.log.startReinitApp('debug');
    // Before init new logger, works previous logger.
    try {
      this.bootstrapProvidersPerApp();
    } catch (err) {
      this.log.logger = previousLogger;
      this.log.bufferLogs = false;
      this.log.flush();
      return this.handleReinitError(err);
    }
    // After init new logger, works new logger.
    try {
      await this.bootstrapModulesAndExtensions();
      if (autocommit) {
        this.moduleManager.commit();
      } else {
        this.log.skippingAutocommitModulesConfig('warn');
      }
      this.log.finishReinitApp('debug');
    } catch (err) {
      return this.handleReinitError(err);
    } finally {
      this.log.bufferLogs = false;
      this.log.flush();
    }
  }

  requestListener: RequestListener = async (nodeReq, nodeRes) => {
    await this.preRouter.requestListener(nodeReq, nodeRes);
  };

  protected async handleReinitError(err: unknown) {
    this.log.printReinitError('error', { className: this.constructor.name }, err);
    this.log.startRollbackModuleConfigChanges('debug');
    this.moduleManager.rollback();
    this.bootstrapProvidersPerApp();
    await this.bootstrapModulesAndExtensions();
    this.log.successfulRollbackModuleConfigChanges('debug');
    return err as Error;
  }

  /**
   * Merge AppModule metadata with default metadata for root module.
   */
  protected mergeMetadata(appModule: ModuleType): void {
    const serverMetadata = getModuleMetadata(appModule, true);
    if (!serverMetadata) {
      const modName = getModuleName(appModule);
      throw new Error(`Module build failed: module "${modName}" does not have the "@RootModule()" decorator`);
    }

    // Setting default metadata.
    this.meta = new RootMetadata();

    pickProperties(this.meta, serverMetadata);
  }

  /**
   * 1. checks collisions for non-root exported providers per app;
   * 2. then merges these providers with providers that declared on root module.
   *
   * @param meta root metadata.
   */
  protected prepareProvidersPerApp(meta: NormalizedModuleMetadata, moduleManager: ModuleManager) {
    // Here we work only with providers declared at the application level.

    const providersAndExtensions = this.collectProvidersPerAppAndExtensions(meta, moduleManager);
    const { providersPerApp: exportedProviders, extensions } = providersAndExtensions;
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
    this.meta.extensions.unshift(...extensions);
  }

  /**
   * Recursively collects per app providers and extensions from non-root modules.
   */
  protected collectProvidersPerAppAndExtensions(meta1: NormalizedModuleMetadata, moduleManager: ModuleManager) {
    const modules = [
      ...meta1.importsModules,
      ...meta1.importsWithParams,
      ...meta1.exportsModules,
      ...meta1.exportsWithParams,
    ];
    const providersPerApp: ServiceProvider[] = [];
    const extensions: InjectionToken<Extension<any>[]>[] = [];
    // Removes duplicate (because of reexports modules)
    new Set(modules).forEach((mod) => {
      const meta2 = moduleManager.getMetadata(mod, true);
      const obj = this.collectProvidersPerAppAndExtensions(meta2, moduleManager);
      providersPerApp.push(...obj.providersPerApp);
      extensions.push(...obj.extensions);
    });
    const currProvidersPerApp = isRootModule(meta1) ? [] : meta1.providersPerApp;

    return {
      providersPerApp: [...providersPerApp, ...getUniqProviders(currProvidersPerApp)],
      extensions: [...extensions, ...meta1.extensions],
    };
  }

  protected addDefaultProvidersPerApp() {
    this.logManager = this.log.getLogManager();
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
    const log = this.injectorPerApp.get(Log) as Log;
    log.bufferLogs = true;
    this.log = log;
  }

  protected bootstrapModuleFactory(moduleManager: ModuleManager) {
    const globalProviders = this.getGlobalProviders(moduleManager);
    this.log.printGlobalProviders('trace', { className: this.constructor.name }, globalProviders);
    const moduleFactory = this.injectorPerApp.resolveAndInstantiate(ModuleFactory) as ModuleFactory;
    const appModule = moduleManager.getMetadata('root').module;
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
    } = moduleFactory.exportGlobalProviders(moduleManager, globalProviders);

    globalProviders.providersPerMod = providersPerMod.slice();
    globalProviders.providersPerRou = providersPerRou.slice();
    globalProviders.providersPerReq = providersPerReq.slice();
    globalProviders.importedPerMod = importedPerMod;
    globalProviders.importedPerRou = importedPerRou;
    globalProviders.importedPerReq = importedPerReq;
    return globalProviders;
  }

  protected async handleExtensions(appMetadataMap: AppMetadataMap) {
    this.applyAppMetadataMap(appMetadataMap);
    const initedExtensionsGroups = new WeakSet<InjectionToken<Extension<any>[]>>();
    const extensionsManager = this.injectorPerApp.get(ExtensionsManager) as ExtensionsManager;
    for (const [, metadata] of appMetadataMap) {
      if (isRootModule(metadata.meta)) {
        metadata.meta.extensions = this.meta.extensions;
      }
      const { extensions, name: moduleName } = metadata.meta;
      for (const groupToken of extensions) {
        if (initedExtensionsGroups.has(groupToken)) {
          continue;
        }
        const beforeToken = `BEFORE ${groupToken}`;
        this.log.startExtensionsGroupInit('debug', { className: this.constructor.name }, moduleName, beforeToken);
        await extensionsManager.init(beforeToken);
        this.log.finishExtensionsGroupInit('debug', { className: this.constructor.name }, moduleName, beforeToken);

        this.log.startExtensionsGroupInit('debug', { className: this.constructor.name }, moduleName, groupToken);
        await extensionsManager.init(groupToken);
        this.log.finishExtensionsGroupInit('debug', { className: this.constructor.name }, moduleName, groupToken);
        initedExtensionsGroups.add(groupToken);
      }
    }
    extensionsManager.clearUnfinishedInitExtensions();
    this.logExtensionsStatistic();
  }

  protected logExtensionsStatistic() {
    const counter = this.injectorPerApp.get(Counter) as Counter;
    const extensions = counter.getInitedExtensions();
    const names = Array.from(extensions)
      .map((e) => e.constructor.name)
      .join(', ');
    this.log.totalInitedExtensions('debug', { className: this.constructor.name }, extensions.size, names);
    counter.resetInitedExtensionsSet();
  }

  protected applyAppMetadataMap(appMetadataMap: AppMetadataMap) {
    this.meta.providersPerApp.unshift({ provide: APP_METADATA_MAP, useValue: appMetadataMap });
    this.createInjectorAndSetLog();
  }
}
