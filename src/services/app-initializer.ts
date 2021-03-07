import { Injectable, ReflectiveInjector, Type } from '@ts-stack/di';

import { NormalizedModuleMetadata } from '../models/normalized-module-metadata';
import { NormalizedRootModuleMetadata } from '../models/normalized-root-module-metadata';
import { ProvidersMetadata } from '../models/providers-metadata';
import { ModuleFactory } from '../module-factory';
import { Extension } from '../types/extension';
import { ExtensionMetadata } from '../types/extension-metadata';
import { Logger } from '../types/logger';
import { ModuleType } from '../types/module-type';
import { ServiceProvider } from '../types/service-provider';
import { getDuplicates } from '../utils/get-duplicates';
import { getModuleName } from '../utils/get-module-name';
import { getTokensCollisions } from '../utils/get-tokens-collisions';
import { getUniqProviders } from '../utils/get-uniq-providers';
import { normalizeProviders } from '../utils/ng-utils';
import { throwProvidersCollisionError } from '../utils/throw-providers-collision-error';
import { isRootModule } from '../utils/type-guards';
import { defaultProvidersPerApp } from './default-providers-per-app';
import { defaultProvidersPerReq } from './default-providers-per-req';
import { ModuleManager } from './module-manager';
import { PreRouter } from './pre-router';

@Injectable()
export class AppInitializer {
  protected log: Logger;
  protected injectorPerApp: ReflectiveInjector;
  protected preRouter: PreRouter;
  protected opts: NormalizedRootModuleMetadata;
  protected extensionsMetadataMap: Map<ModuleType, ExtensionMetadata>;
  #moduleManager: ModuleManager;

  async init(appModule: ModuleType, moduleManager: ModuleManager) {
    if (this.#moduleManager) {
      throw new Error('You can init the application only once. Try reInit() instead.');
    }
    this.#moduleManager = moduleManager;
    moduleManager.scanRootModule(appModule);
    await this.reInit();
    return { opts: this.opts, log: this.log, preRouter: this.preRouter };
  }

  async reInit() {
    const rootMetadata = this.#moduleManager.getMetadata('root');
    this.prepareProvidersPerApp(rootMetadata);
    this.initProvidersPerApp();
    this.extensionsMetadataMap = this.bootstrapModuleFactory(rootMetadata);
    this.checkModulesResolvable(this.extensionsMetadataMap);
    await this.handleExtensions(this.extensionsMetadataMap);
  }

  /**
   * 1. checks collisions for non-root exported providers per app;
   * 2. then merges these providers with providers that declared on root module.
   */
  protected prepareProvidersPerApp(rootMetadata: NormalizedModuleMetadata) {
    // Here we work only with providers declared at the application level.

    const exportedProviders = this.collectProvidersPerApp(rootMetadata);
    const rootTokens = normalizeProviders(this.opts.providersPerApp).map((np) => np.provide);
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
      const moduleName = getModuleName(rootMetadata.module);
      throwProvidersCollisionError(moduleName, exportedTokensDuplicates);
    }
    this.opts.providersPerApp.unshift(...exportedProviders);
  }

  /**
   * Recursively collects per app providers from non-root modules.
   */
  protected collectProvidersPerApp(metadata: NormalizedModuleMetadata) {
    const modules = [
      ...metadata.importsModules,
      ...metadata.importsWithParams,
      ...metadata.exportsModules,
    ];
    const providersPerApp: ServiceProvider[] = [];
    modules.forEach((mod) => {
      const metadata = this.#moduleManager.getMetadata(mod);
      providersPerApp.push(...this.collectProvidersPerApp(metadata));
    });
    const currProvidersPerApp = isRootModule(metadata) ? [] : metadata.providersPerApp;

    return [...providersPerApp, ...getUniqProviders(currProvidersPerApp)];
  }

  /**
   * Init providers per the application.
   */
  protected initProvidersPerApp() {
    this.opts.providersPerApp.unshift(
      ...defaultProvidersPerApp,
      { provide: NormalizedRootModuleMetadata, useValue: this.opts },
      { provide: AppInitializer, useValue: this }
    );
    this.injectorPerApp = ReflectiveInjector.resolveAndCreate(this.opts.providersPerApp);
    this.log = this.injectorPerApp.get(Logger) as Logger;
    this.preRouter = this.injectorPerApp.get(PreRouter) as PreRouter;
  }

  protected bootstrapModuleFactory(rootMetadata: NormalizedModuleMetadata) {
    const globalProviders = this.getGlobalProviders(rootMetadata);
    this.log.trace({ globalProviders });
    const rootModule = this.injectorPerApp.resolveAndInstantiate(ModuleFactory) as ModuleFactory;
    return rootModule.bootstrap(globalProviders, '', rootMetadata);
  }

  protected getGlobalProviders(rootMetadata: NormalizedModuleMetadata) {
    const globalProviders = new ProvidersMetadata();
    globalProviders.providersPerApp = this.opts.providersPerApp;
    const rootModule = this.injectorPerApp.resolveAndInstantiate(ModuleFactory) as ModuleFactory;
    const { providersPerMod, providersPerReq } = rootModule.importGlobalProviders(rootMetadata, globalProviders);
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
    const allExtensions: Type<Extension>[] = [];
    for (const [, metadata] of extensionsMetadataMap) {
      allExtensions.push(...metadata.moduleMetadata.extensions);
    }
    for (const Ext of allExtensions) {
      this.log.debug(`start init ${Ext.name} extension`);
      const extension = this.injectorPerApp.get(Ext) as Extension;
      await extension.init(this.opts.prefixPerApp, extensionsMetadataMap);
      this.log.debug(`finish init ${Ext.name} extension`);
    }
    this.log.debug(`Total extensions initialized: ${allExtensions.length}`);
  }
}
