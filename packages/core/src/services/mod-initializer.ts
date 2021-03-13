import { Injectable, ReflectiveInjector } from '@ts-stack/di';

import { RootMetadata } from '../models/root-metadata';
import { ProvidersMetadata } from '../models/providers-metadata';
import { ModuleFactory } from '../module-factory';
import { Extension } from '../types/extension';
import { ExtensionMetadata } from '../types/extension-metadata';
import { Logger } from '../types/logger';
import { ModuleType } from '../types/module-type';
import { defaultProvidersPerReq } from './default-providers-per-req';
import { ModuleManager } from './module-manager';
import { ExtensionType } from '../types/extension-type';
import { ModuleWithParams } from '../types/module-with-params';
import { getModule } from '../utils/get-module';

@Injectable()
export class ModInitializer {
  protected extensionsMetadataMap: Map<ModuleType | ModuleWithParams, ExtensionMetadata>;

  constructor(
    protected meta: RootMetadata,
    protected injectorPerApp: ReflectiveInjector,
    protected log: Logger,
    protected moduleManager: ModuleManager
  ) {}

  async init() {
    this.extensionsMetadataMap = this.bootstrapModuleFactory(this.moduleManager);
    this.checkModulesResolvable(this.extensionsMetadataMap);
    await this.handleExtensions(this.extensionsMetadataMap);
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

  protected checkModulesResolvable(extensionsMetadataMap: Map<ModuleType | ModuleWithParams, ExtensionMetadata>) {
    extensionsMetadataMap.forEach((metadata, modOrObj) => {
      this.log.trace(modOrObj, metadata);
      const { providersPerMod } = metadata.moduleMetadata;
      const injectorPerMod = this.injectorPerApp.resolveAndCreateChild(providersPerMod);
      const mod = getModule(modOrObj);
      injectorPerMod.resolveAndInstantiate(mod);
    });
  }

  protected async handleExtensions(extensionsMetadataMap: Map<ModuleType | ModuleWithParams, ExtensionMetadata>) {
    const allExtensions: ExtensionType[] = this.meta.extensions.slice();
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
