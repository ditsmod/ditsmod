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
  Extension,
} from '@ditsmod/core';

import { OverriderConfig } from './types.js';
import { OVERRIDERS_CONFIG } from './constants.js';

@injectable()
export class TestExtensionsManager extends ExtensionsManager {
  constructor(
    injector: Injector,
    systemLogMediator: SystemLogMediator,
    counter: Counter,
    extensionsContext: ExtensionsContext,
    extensionCounters: ExtensionCounters,
    @inject(OVERRIDERS_CONFIG)
    @optional()
    protected aOverriderConfig: OverriderConfig[] = [],
  ) {
    super(injector, systemLogMediator, counter, extensionsContext, extensionCounters);
  }

  override async stage1<T>(groupToken: ExtensionsGroupToken<T>): Promise<Stage1GroupMeta<T>>;
  override async stage1<T>(groupToken: ExtensionsGroupToken<T>, pendingExtension: Extension): Promise<Stage1GroupMeta2<T>>;
  override async stage1<T>(groupToken: ExtensionsGroupToken<T>, pendingExtension?: Extension) {
    const stage1GroupMeta = await super.stage1<T>(groupToken, pendingExtension as Extension);
    this.aOverriderConfig.forEach((overriderConfig) => {
      if (groupToken !== overriderConfig.groupToken) {
        return;
      }
      overriderConfig.override(stage1GroupMeta);
    });
    return stage1GroupMeta;
  }
}
