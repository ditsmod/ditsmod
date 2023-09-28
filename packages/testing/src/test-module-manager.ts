import {
  AppendsWithParams,
  ModuleManager,
  ModuleType,
  ModuleWithParams,
  NormalizedModuleMetadata,
  OutputLogLevel,
} from '@ditsmod/core';
import { PreRouterExtension } from '@ditsmod/routing';

import { TestPreRouterExtension } from './test-pre-router.extensions.js';
import { TestProvider } from './types.js';

type AnyModule = ModuleType | ModuleWithParams | AppendsWithParams;

export class TestModuleManager extends ModuleManager {
  protected providersToOverride: TestProvider[] = [];
  protected logLevel: OutputLogLevel;

  overrideProviders(providers: TestProvider[]) {
    this.providersToOverride = providers;
  }

  /**
   * This `logLevel` is set after the HTTP request handlers are installed.
   * It does not cover application initialization time.
   */
  setLogLevel(logLevel: OutputLogLevel) {
    this.logLevel = logLevel;
  }

  getLogLevel() {
    return this.logLevel || 'off';
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
