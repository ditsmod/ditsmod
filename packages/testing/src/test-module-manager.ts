import {
  AppendsWithParams,
  ModuleManager,
  ModuleType,
  ModuleWithParams,
  NormalizedModuleMetadata,
  PreRouterExtension,
  Provider,
} from '@ditsmod/core';
import { TestPreRouterExtension } from './test-pre-router.extensions';

type AnyModule = ModuleType | ModuleWithParams | AppendsWithParams;

export class TestModuleManager extends ModuleManager {
  protected providersToOverride: Provider[] = [];

  setProvidersToOverride(providers: Provider[]) {
    this.providersToOverride = providers;
  }

  getProvidersToOverride() {
    return this.providersToOverride;
  }

  protected override normalizeMetadata(mod: AnyModule): NormalizedModuleMetadata {
    const meta = super.normalizeMetadata(mod);
    meta.extensionsProviders.push({ token: PreRouterExtension, useClass: TestPreRouterExtension });
    meta.providersPerApp.push({ token: TestModuleManager, useToken: ModuleManager });
    return meta;
  }
}
