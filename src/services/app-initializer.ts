import { Injectable, Provider, ReflectiveInjector, reflector, resolveForwardRef, Type } from '@ts-stack/di';

import { Core } from '../core';
import { AppMetadata } from '../decorators/app-metadata';
import { defaultProvidersPerReq, ModuleDecorator, ModuleWithOptions, ProvidersMetadata } from '../decorators/module';
import { defaultExtensions, defaultProvidersPerApp, RootModuleDecorator } from '../decorators/root-module';
import { ModuleFactory } from '../module-factory';
import { Logger } from '../types/logger';
import { Extension, ExtensionMetadata, ModuleType } from '../types/types';
import { getDuplicates } from '../utils/get-duplicates';
import { mergeArrays } from '../utils/merge-arrays-options';
import { flatten, normalizeProviders } from '../utils/ng-utils';
import { pickProperties } from '../utils/pick-properties';
import { isProvider, isRootModule } from '../utils/type-guards';
import { PreRouter } from './pre-router';

@Injectable()
export class AppInitializer extends Core {
  protected log: Logger;
  protected injectorPerApp: ReflectiveInjector;
  protected preRouter: PreRouter;
  protected opts: AppMetadata;
  protected appModule: ModuleType;
  protected extensionsMetadataMap: Map<ModuleType, ExtensionMetadata>;

  async init(appModule: ModuleType) {
    this.appModule = appModule;
    await this.reInit();
    return { opts: this.opts, log: this.log, preRouter: this.preRouter };
  }

  async reInit() {
    this.mergeMetadata(this.appModule);
    this.prepareProvidersPerApp(this.appModule);
    this.initProvidersPerApp();
    this.extensionsMetadataMap = this.bootstrapModuleFactory(this.appModule);
    this.checkModulesResolvable(this.extensionsMetadataMap);
    await this.handleExtensions(this.extensionsMetadataMap);
  }

  /**
   * Merge AppModule metadata with default AppMetadata.
   */
  protected mergeMetadata(appModule: ModuleType): void {
    const modMetadata = reflector.annotations(appModule).find(isRootModule);
    if (!modMetadata) {
      throw new Error(
        `Module build failed: module "${appModule.name}" does not have the "@RootModule()" decorator`
      );
    }

    // Setting default metadata.
    this.opts = new AppMetadata();

    modMetadata.extensions = mergeArrays(defaultExtensions, modMetadata.extensions);
    pickProperties(this.opts, modMetadata);
  }

  /**
   * 1. checks collisions for non-root exported providers per app;
   * 2. then merges these providers with providers that declared on root module.
   */
  protected prepareProvidersPerApp(appModule: ModuleType) {
    // Here we work only with providers declared at the application level.

    const exportedProviders = this.collectProvidersPerApp(appModule);
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
    exportedTokensDuplicates = this.getTokensCollisions(exportedTokensDuplicates, mergedProviders);
    if (exportedTokensDuplicates.length) {
      this.throwProvidersCollisionError(appModule.name, exportedTokensDuplicates);
    }
    this.opts.providersPerApp.unshift(...exportedProviders);
  }

  /**
   * Recursively collects per app providers from non-root modules.
   */
  protected collectProvidersPerApp(modOrObject: Type<any> | ModuleWithOptions<any>) {
    const modName = this.getModuleName(modOrObject);
    const modMetadata = this.getRawModuleMetadata(modOrObject) as RootModuleDecorator | ModuleDecorator;
    this.checkModuleMetadata(modMetadata, modName);

    let modules = [modMetadata.imports, modMetadata.exports?.filter((exp) => !isProvider(exp))];
    modules = modules.filter((el) => el);
    const preparedModules = flatten(modules).map<Type<any> | ModuleWithOptions<any>>(resolveForwardRef);
    const providersPerApp: Provider[] = [];
    preparedModules.forEach((mod) => providersPerApp.push(...this.collectProvidersPerApp(mod)));
    const currProvidersPerApp = isRootModule(modMetadata) ? [] : flatten(modMetadata.providersPerApp);

    return [...providersPerApp, ...this.getUniqProviders(currProvidersPerApp)];
  }

  /**
   * Init providers per the application.
   */
  protected initProvidersPerApp() {
    this.opts.providersPerApp.unshift(
      ...defaultProvidersPerApp,
      { provide: AppMetadata, useValue: this.opts },
      { provide: AppInitializer, useValue: this }
    );
    this.injectorPerApp = ReflectiveInjector.resolveAndCreate(this.opts.providersPerApp);
    this.log = this.injectorPerApp.get(Logger) as Logger;
    this.preRouter = this.injectorPerApp.get(PreRouter) as PreRouter;
  }

  protected bootstrapModuleFactory(appModule: ModuleType) {
    const globalProviders = this.getGlobalProviders(appModule);
    this.log.trace({ globalProviders });
    const rootModule = this.injectorPerApp.resolveAndInstantiate(ModuleFactory) as ModuleFactory;
    return rootModule.bootstrap(globalProviders, '', appModule);
  }

  protected getGlobalProviders(appModule: ModuleType) {
    const globalProviders = new ProvidersMetadata();
    globalProviders.providersPerApp = this.opts.providersPerApp;
    const rootModule = this.injectorPerApp.resolveAndInstantiate(ModuleFactory) as ModuleFactory;
    const { providersPerMod, providersPerReq } = rootModule.importGlobalProviders(appModule, globalProviders);
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
