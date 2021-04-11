import { Injectable, InjectionToken, ReflectiveInjector } from '@ts-stack/di';

import { NormalizedModuleMetadata } from '../models/normalized-module-metadata';
import { ProvidersMetadata } from '../models/providers-metadata';
import { RootMetadata } from '../models/root-metadata';
import { ModuleFactory } from '../module-factory';
import { AppMetadataMap, APP_METADATA_MAP } from '../types/app-metadata-map';
import { Logger } from '../types/logger';
import { ModuleType, ServiceProvider } from '../types/mix';
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
import { defaultExtensions } from './default-extensions';
import { defaultProvidersPerApp } from './default-providers-per-app';
import { defaultProvidersPerReq } from './default-providers-per-req';
import { ExtensionsManager } from './extensions-manager';
import { ModuleManager } from './module-manager';
import { PreRouter } from '../extensions/pre-router';
import { Counter } from './counter';

interface MapedExtension {
  moduleName: string;
  groupToken: InjectionToken<any>;
  injectorPerMod: ReflectiveInjector;
}

@Injectable()
export class AppInitializer {
  protected log: Logger;
  protected injectorPerApp: ReflectiveInjector;
  protected preRouter: PreRouter;
  protected meta: RootMetadata;
  protected appMetadataMap: AppMetadataMap;

  constructor(protected moduleManager: ModuleManager) {}

  async reinit(autocommit: boolean = true): Promise<void | Error> {
    const log = this.log;
    log.debug('Start reinit the application.');

    try {
      await this.init();
      if (autocommit) {
        this.moduleManager.commit();
      } else {
        this.log.warn('Skipping autocommit of changes for config of moduleManager.');
      }
      this.log.debug('Finished reinit the application.');
    } catch (err) {
      log.error(err);
      log.debug('Start rollback of changes for config of moduleManager during reinit the application.');
      this.moduleManager.rollback();
      await this.init();
      this.log.debug('Successful rollback of changes for config of moduleManager during reinit the application.');
      return err;
    }
  }

  bootstrapProvidersPerApp() {
    const meta = this.moduleManager.getMetadata('root', true);
    this.mergeMetadata(meta.module as ModuleType);
    this.prepareProvidersPerApp(meta, this.moduleManager);
    this.addDefaultProvidersPerApp();
    this.createInjectorPerApp();
    this.moduleManager.setLogger(this.log);
  }

  async bootstrapModulesAndExtensions() {
    this.appMetadataMap = this.bootstrapModuleFactory(this.moduleManager);
    this.checkModulesResolvable(this.appMetadataMap);
    await this.handleExtensions(this.appMetadataMap);
    this.preRouter = this.injectorPerApp.get(PreRouter) as PreRouter;
  }

  getMetadataAndLogger() {
    return { meta: this.meta, log: this.log };
  }

  requestListener: RequestListener = async (nodeReq, nodeRes) => {
    await this.preRouter.requestListener(nodeReq, nodeRes);
  };

  protected async init() {
    this.bootstrapProvidersPerApp();
    await this.bootstrapModulesAndExtensions();
  }

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

    const exportedProviders = this.collectProvidersPerApp(meta, moduleManager);
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
  }

  /**
   * Recursively collects per app providers from non-root modules.
   */
  protected collectProvidersPerApp(metadata: NormalizedModuleMetadata, moduleManager: ModuleManager) {
    const modules = [...metadata.importsModules, ...metadata.importsWithParams, ...metadata.exportsModules];
    const providersPerApp: ServiceProvider[] = [];
    modules.forEach((mod) => {
      const meta = moduleManager.getMetadata(mod, true);
      providersPerApp.push(...this.collectProvidersPerApp(meta, moduleManager));
    });
    const currProvidersPerApp = isRootModule(metadata) ? [] : metadata.providersPerApp;

    return [...providersPerApp, ...getUniqProviders(currProvidersPerApp)];
  }

  protected addDefaultProvidersPerApp() {
    this.meta.providersPerApp.unshift(
      ...defaultProvidersPerApp,
      { provide: RootMetadata, useValue: this.meta },
      { provide: ModuleManager, useValue: this.moduleManager },
      { provide: AppInitializer, useValue: this }
    );
  }

  /**
   * Create injector per the application.
   */
  protected createInjectorPerApp() {
    this.injectorPerApp = ReflectiveInjector.resolveAndCreate(this.meta.providersPerApp);
    this.log = this.injectorPerApp.get(Logger) as Logger;
  }

  protected bootstrapModuleFactory(moduleManager: ModuleManager) {
    const globalProviders = this.getGlobalProviders(moduleManager);
    this.log.trace({ globalProviders });
    const moduleFactory = this.injectorPerApp.resolveAndInstantiate(ModuleFactory) as ModuleFactory;
    const appModule = moduleManager.getMetadata('root').module;
    return moduleFactory.bootstrap(globalProviders, '', appModule, moduleManager);
  }

  protected getGlobalProviders(moduleManager: ModuleManager) {
    const globalProviders = new ProvidersMetadata();
    globalProviders.providersPerApp = this.meta.providersPerApp;
    const moduleFactory = this.injectorPerApp.resolveAndInstantiate(ModuleFactory) as ModuleFactory;
    const { providersPerMod, providersPerReq } = moduleFactory.exportGlobalProviders(moduleManager, globalProviders);
    globalProviders.providersPerMod = providersPerMod;
    globalProviders.providersPerReq = [...defaultProvidersPerReq, ...providersPerReq];
    return globalProviders;
  }

  protected checkModulesResolvable(appMetadataMap: AppMetadataMap) {
    appMetadataMap.forEach((metadata, modOrObj) => {
      this.log.trace(modOrObj, metadata);
      const { providersPerMod } = metadata.moduleMetadata;
      const injectorPerMod = this.injectorPerApp.resolveAndCreateChild(providersPerMod);
      const mod = getModule(modOrObj);
      injectorPerMod.resolveAndInstantiate(mod);
    });
  }

  protected async handleExtensions(appMetadataMap: AppMetadataMap) {
    this.applyAppMetadataMap(appMetadataMap);
    for (const [, metadata] of appMetadataMap) {
      if (isRootModule(metadata.moduleMetadata)) {
        metadata.moduleMetadata.extensions = this.meta.extensions;
      }
      const { extensions, name: moduleName } = metadata.moduleMetadata;
      for (const groupToken of extensions) {
        this.log.debug(`${moduleName}: start init group with ${groupToken}`);
        const extensionsManager = this.injectorPerApp.resolveAndInstantiate(ExtensionsManager) as ExtensionsManager;
        await extensionsManager.init(groupToken);
        this.log.debug(`${moduleName}: finish init group with ${groupToken}`);
      }
    }

    this.logExtensionsStatistic();
  }

  protected logExtensionsStatistic() {
    const counter = this.injectorPerApp.get(Counter) as Counter;
    const extensions = counter.getInitedExtensions();
    const names = Array.from(extensions)
      .map((e) => e.constructor.name)
      .join(', ');
    this.log.debug(`Total inited ${extensions.size} extensions: ${names}`);
    counter.resetInitedExtensionsSet();
  }

  protected applyAppMetadataMap(appMetadataMap: AppMetadataMap) {
    this.meta.providersPerApp.unshift({ provide: APP_METADATA_MAP, useValue: appMetadataMap });
    this.createInjectorPerApp();
  }
}
