import {
  AppendsWithParams,
  ModuleManager,
  ModuleType,
  ModuleWithParams,
  NormalizedModuleMetadata,
  PreRouterExtension,
  NormalizedProvider,
} from '@ditsmod/core';
import { TestPreRouterExtension } from './test-pre-router.extensions';

type AnyModule = ModuleType | ModuleWithParams | AppendsWithParams;

export class TestModuleManager extends ModuleManager {
  protected providersToOverride: NormalizedProvider[] = [];
  protected providersToSetPerApp: NormalizedProvider[] = [];

  overrideProviders(providers: NormalizedProvider[]) {
    this.providersToOverride = providers;
  }

  setProvidersPerApp(providers: NormalizedProvider[]) {
    this.providersToSetPerApp = providers;
  }

  getProvidersToOverride() {
    return this.providersToOverride;
  }

  getProvidersToSetPerApp() {
    return this.providersToSetPerApp;
  }

  protected override normalizeMetadata(mod: AnyModule): NormalizedModuleMetadata {
    const meta = super.normalizeMetadata(mod);
    meta.extensionsProviders.push({ token: PreRouterExtension, useClass: TestPreRouterExtension });
    meta.providersPerApp.push({ token: TestModuleManager, useToken: ModuleManager });
    return meta;
  }
}
