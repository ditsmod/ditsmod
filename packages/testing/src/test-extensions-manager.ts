import {
  ExtensionCounters,
  ExtensionsContext,
  ExtensionsGroupToken,
  ExtensionsManager,
  inject,
  injectable,
  Injector,
  optional,
  Stage1GroupMeta,
  Stage1GroupMeta2,
  SystemLogMediator,
  Counter,
} from '@ditsmod/core';

import { OverriderConfig } from './types.js';
import { GROUP_METAOVERRIDER } from './constants.js';

@injectable()
export class TestExtensionsManager extends ExtensionsManager {
  constructor(
    injector: Injector,
    systemLogMediator: SystemLogMediator,
    counter: Counter,
    extensionsContext: ExtensionsContext,
    extensionCounters: ExtensionCounters,
    @inject(GROUP_METAOVERRIDER)
    @optional()
    protected aOverriderConfig: OverriderConfig[] = [],
  ) {
    super(injector, systemLogMediator, counter, extensionsContext, extensionCounters);
  }

  override async stage1<T>(groupToken: ExtensionsGroupToken<T>, perApp?: false): Promise<Stage1GroupMeta<T>>;
  override async stage1<T>(groupToken: ExtensionsGroupToken<T>, perApp: true): Promise<Stage1GroupMeta2<T>>;
  override async stage1<T>(groupToken: ExtensionsGroupToken<T>, perApp?: boolean) {
    const stage1GroupMeta = await super.stage1<T>(groupToken, perApp as true);
    this.aOverriderConfig.forEach((overriderConfig) => {
      if (groupToken !== overriderConfig.groupToken) {
        return;
      }
      overriderConfig.override(overriderConfig.providers, stage1GroupMeta);
    });
    return stage1GroupMeta;
  }
}
