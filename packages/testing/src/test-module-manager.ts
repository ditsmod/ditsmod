import {
  AppendsWithParams,
  ModuleManager,
  ModuleType,
  ModuleWithParams,
  NormalizedModuleMetadata,
  PreRouterExtension,
  Provider,
} from '@ditsmod/core';
import { TestingExtension } from './testing.extensions';

type AnyModule = ModuleType | ModuleWithParams | AppendsWithParams;

export class TestModuleManager extends ModuleManager {
  protected providersToOverride: Provider[] = [];

  setProvidersToOverride(providers: Provider[]) {}
  getProvidersToOverride() {}

  protected override normalizeMetadata(mod: AnyModule): NormalizedModuleMetadata {
    const meta = super.normalizeMetadata(mod);
    meta.extensionsProviders.push({ token: PreRouterExtension, useClass: TestingExtension });
    meta.providersPerApp.push({ token: TestModuleManager, useToken: ModuleManager });
    return meta;
  }
}
