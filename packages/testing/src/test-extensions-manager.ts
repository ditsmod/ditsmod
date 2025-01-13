import {
  ExtensionCounters,
  ExtensionsContext,
  ExtensionsGroupToken,
  inject,
  injectable,
  Injector,
  optional,
  Stage1GroupMeta,
  Stage1GroupMeta2,
  SystemLogMediator,
  Counter,
  Extension,
  InternalExtensionsManager,
} from '@ditsmod/core';

import { OverriderConfig } from './types.js';
import { OVERRIDERS_CONFIG } from './constants.js';

@injectable()
export class TestExtensionsManager extends InternalExtensionsManager {
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

  override async stage1<T>(ExtCls: ExtensionsGroupToken<T>): Promise<Stage1GroupMeta<T>>;
  override async stage1<T>(ExtCls: ExtensionsGroupToken<T>, pendingExtension: Extension): Promise<Stage1GroupMeta2<T>>;
  override async stage1<T>(ExtCls: ExtensionsGroupToken<T>, pendingExtension?: Extension) {
    const stage1GroupMeta = await super.stage1<T>(ExtCls, pendingExtension as Extension);
    this.aOverriderConfig.forEach((overriderConfig) => {
      if (ExtCls === overriderConfig.ExtCls) {
        overriderConfig.override(stage1GroupMeta);
      }
    });
    return stage1GroupMeta;
  }
}
