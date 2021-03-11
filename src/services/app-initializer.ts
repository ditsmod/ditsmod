import { Injectable, ReflectiveInjector } from '@ts-stack/di';

import { NormalizedModuleMetadata } from '../models/normalized-module-metadata';
import { RootMetadata } from '../models/root-metadata';
import { ProvidersMetadata } from '../models/providers-metadata';
import { ModuleFactory } from '../module-factory';
import { Extension } from '../types/extension';
import { ExtensionMetadata } from '../types/extension-metadata';
import { Logger } from '../types/logger';
import { ModuleType } from '../types/module-type';
import { ServiceProvider } from '../types/service-provider';
import { getDuplicates } from '../utils/get-duplicates';
import { getModuleMetadata } from '../utils/get-module-metadata';
import { getModuleName } from '../utils/get-module-name';
import { getTokensCollisions } from '../utils/get-tokens-collisions';
import { getUniqProviders } from '../utils/get-uniq-providers';
import { mergeArrays } from '../utils/merge-arrays-options';
import { normalizeProviders } from '../utils/ng-utils';
import { pickProperties } from '../utils/pick-properties';
import { throwProvidersCollisionError } from '../utils/throw-providers-collision-error';
import { isRootModule } from '../utils/type-guards';
import { defaultExtensions } from './default-extensions';
import { defaultProvidersPerApp } from './default-providers-per-app';
import { defaultProvidersPerReq } from './default-providers-per-req';
import { ModuleManager } from './module-manager';
import { PreRouter } from './pre-router';
import { ExtensionType } from '../types/extension-type';

@Injectable()
export class AppInitializer {
  protected log: Logger;
  protected injectorPerApp: ReflectiveInjector;
  protected preRouter: PreRouter;
  protected meta: RootMetadata;
  protected extensionsMetadataMap: Map<ModuleType, ExtensionMetadata>;
  #moduleManager: ModuleManager;

  async init(appModule: ModuleType, log: Logger) {
    if (this.#moduleManager) {
      throw new Error('You can call init() only once. Try reInit() instead.');
    }
    const moduleManager = new ModuleManager(this.log);
    this.#moduleManager = moduleManager;
    this.log = log;
    moduleManager.scanRootModule(appModule);
    await this.reInit();
    return { meta: this.meta, log: this.log, preRouter: this.preRouter };
  }

  async reInit() {
    const meta = this.#moduleManager.getMetadata('root', true);
    this.mergeMetadata(meta.module as ModuleType);
    this.prepareProvidersPerApp(meta, this.#moduleManager);
    this.initProvidersPerApp();
    this.extensionsMetadataMap = this.bootstrapModuleFactory(this.#moduleManager);
    this.checkModulesResolvable(this.extensionsMetadataMap);
    await this.handleExtensions(this.extensionsMetadataMap);
  }

  /**
   * Merge AppModule metadata with default metadata for root module.
   */
  protected mergeMetadata(appModule: ModuleType): void {
    const serverMetadata = getModuleMetadata(appModule, true);

    // Setting default metadata.
    this.meta = new RootMetadata();

    serverMetadata.extensions = mergeArrays(defaultExtensions, serverMetadata.extensions);
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
    const modules = [
      ...metadata.importsModules,
      ...metadata.importsWithParams,
      ...metadata.exportsModules,
    ];
    const providersPerApp: ServiceProvider[] = [];
    modules.forEach((mod) => {
      const meta = moduleManager.getMetadata(mod, true);
      providersPerApp.push(...this.collectProvidersPerApp(meta, moduleManager));
    });
    const currProvidersPerApp = isRootModule(metadata) ? [] : metadata.providersPerApp;

    return [...providersPerApp, ...getUniqProviders(currProvidersPerApp)];
  }

  /**
   * Init providers per the application.
   */
  protected initProvidersPerApp() {
    this.meta.providersPerApp.unshift(
      ...defaultProvidersPerApp,
      { provide: RootMetadata, useValue: this.meta },
      { provide: AppInitializer, useValue: this }
    );
    this.injectorPerApp = ReflectiveInjector.resolveAndCreate(this.meta.providersPerApp);
    this.log = this.injectorPerApp.get(Logger) as Logger;
    this.preRouter = this.injectorPerApp.get(PreRouter) as PreRouter;
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
    const { providersPerMod, providersPerReq } = moduleFactory.importGlobalProviders(moduleManager, globalProviders);
    globalProviders.providersPerMod = providersPerMod;
    globalProviders.providersPerReq = [...defaultProvidersPerReq, ...providersPerReq];
    return globalProviders;
  }

  protected checkModulesResolvable(extensionsMetadataMap: Map<ModuleType, ExtensionMetadata>) {
    extensionsMetadataMap.forEach((metadata, mod) => {
      this.log.trace(mod, metadata);
      const { providersPerMod } = metadata.moduleMetadata;
      const injectorPerMod = this.injectorPerApp.resolveAndCreateChild(providersPerMod);
      injectorPerMod.resolveAndInstantiate(mod);
    });
  }

  protected async handleExtensions(extensionsMetadataMap: Map<ModuleType, ExtensionMetadata>) {
    const allExtensions: ExtensionType[] = [];
    for (const [, metadata] of extensionsMetadataMap) {
      allExtensions.push(...metadata.moduleMetadata.extensions);
    }
    for (const Ext of allExtensions) {
      this.log.debug(`start init ${Ext.name} extension`);
      const extension = this.injectorPerApp.get(Ext) as Extension;
      await extension.init(this.meta.prefixPerApp, extensionsMetadataMap);
      this.log.debug(`finish init ${Ext.name} extension`);
    }
    this.log.debug(`Total extensions initialized: ${allExtensions.length}`);
  }
}
