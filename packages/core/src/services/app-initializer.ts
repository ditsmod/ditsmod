import { Injectable, InjectionToken, ReflectiveInjector } from '@ts-stack/di';

import { NormalizedModuleMetadata } from '../models/normalized-module-metadata';
import { ProvidersMetadata } from '../models/providers-metadata';
import { RootMetadata } from '../models/root-metadata';
import { ModuleFactory } from '../module-factory';
import { AppMetadataMap, ModuleType, ServiceProvider, Extension } from '../types/mix';
import { RequestListener } from '../types/server-options';
import { getDuplicates } from '../utils/get-duplicates';
import { getModule } from '../utils/get-module';
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
import { APP_METADATA_MAP, defaultExtensions } from '../constans';
import { Log } from './log';
import { LogManager } from './log-manager';
import { ImportsMap } from '../types/metadata-per-mod';

@Injectable()
export class AppInitializer {
  protected injectorPerApp: ReflectiveInjector;
  protected preRouter: PreRouterExtension;
  protected meta: RootMetadata;
  protected logManager: LogManager;

  constructor(protected moduleManager: ModuleManager, protected log: Log) {}

  /**
   * _Note:_ after call this method, you need call `this.log.flush()`.
   */
  async initAndGetMetadata() {
    const meta = this.moduleManager.getMetadata('root', true);
    this.mergeMetadata(meta.module as ModuleType);
    this.prepareProvidersPerApp(meta, this.moduleManager);
    this.addDefaultProvidersPerApp();
    this.createInjectorAndSetLog();
    const appMetadataMap = this.bootstrapModuleFactory(this.moduleManager);
    this.checkModulesResolvable(appMetadataMap);
    await this.handleExtensions(appMetadataMap);
    this.preRouter = this.injectorPerApp.get(PreRouterExtension) as PreRouterExtension;
    return this.meta;
  }

  flushLogs() {
    this.log.bufferLogs = false;
    this.log.flush();
  }

  async reinit(autocommit: boolean = true): Promise<void | Error> {
    const oldLogger = this.log.logger;
    this.log.startReinitApp('debug');
    try {
      await this.initAndGetMetadata();
      if (autocommit) {
        this.moduleManager.commit();
      } else {
        this.log.skippingAutocommitModulesConfig('warn');
      }
      this.log.finishReinitApp('debug');
    } catch (err) {
      this.log.logger = oldLogger;
      this.log.printReinitError('error', err);
      this.log.startRollbackModuleConfigChanges('debug');
      this.moduleManager.rollback();
      await this.initAndGetMetadata();
      this.log.successfulRollbackModuleConfigChanges('debug');
      return err as Error;
    } finally {
      this.log.bufferLogs = false;
      this.log.flush();
    }
  }

  requestListener: RequestListener = async (nodeReq, nodeRes) => {
    await this.preRouter.requestListener(nodeReq, nodeRes);
  };

  /**
   * Merge AppModule metadata with default metadata for root module.
   */
  protected mergeMetadata(appModule: ModuleType): void {
    const serverMetadata = getModuleMetadata(appModule, true);

    // Setting default metadata.
    this.meta = new RootMetadata();

    pickProperties(this.meta, serverMetadata);
    this.meta.extensions.unshift(...defaultExtensions);
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
    const rootTokens = normalizeProviders(this.meta.providersPerApp).map((np) => np.provide);
    const exportedNormProviders = normalizeProviders(exportedProviders);
    const exportedTokens = exportedNormProviders.map((np) => np.provide);
    const exportedMultiTokens = exportedNormProviders.filter((np) => np.multi).map((np) => np.provide);
    const defaultTokens = normalizeProviders([...defaultProvidersPerApp]).map((np) => np.provide);
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
    this.log.printGlobalProviders('trace', globalProviders);
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

  protected checkModulesResolvable(appMetadataMap: AppMetadataMap) {
    appMetadataMap.forEach((metadata, modOrObj) => {
      this.log.printModuleMetadata('trace', modOrObj, metadata);
      const { providersPerMod } = metadata.meta;
      const injectorPerMod = this.injectorPerApp.resolveAndCreateChild(providersPerMod);
      const mod = getModule(modOrObj);
      injectorPerMod.resolveAndInstantiate(mod);
    });
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
        this.log.startExtensionsGroupInit('debug', moduleName, beforeToken);
        await extensionsManager.init(beforeToken);
        this.log.finishExtensionsGroupInit('debug', moduleName, beforeToken);

        this.log.startExtensionsGroupInit('debug', moduleName, groupToken);
        await extensionsManager.init(groupToken);
        this.log.finishExtensionsGroupInit('debug', moduleName, groupToken);
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
    this.log.totalInitedExtensions('debug', extensions.size, names);
    counter.resetInitedExtensionsSet();
  }

  protected applyAppMetadataMap(appMetadataMap: AppMetadataMap) {
    this.meta.providersPerApp.unshift({ provide: APP_METADATA_MAP, useValue: appMetadataMap });
    this.createInjectorAndSetLog();
  }
}
