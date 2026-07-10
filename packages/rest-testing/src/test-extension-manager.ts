import {
  ExtensionCounters,
  ExtensionContext,
  ExtensionClass,
  inject,
  injectable,
  Injector,
  optional,
  ExtensionGroupMeta,
  PartialExtensionGroupMeta,
  SystemLogMediator,
  ExtensionStatistics,
  Extension,
  InternalExtensionManager,
} from '@ditsmod/core';

import { OverriderConfig } from './types.js';
import { OVERRIDERS_CONFIG } from './constants.js';

@injectable()
export class TestExtensionManager extends InternalExtensionManager {
  constructor(
    injector: Injector,
    systemLogMediator: SystemLogMediator,
    counter: ExtensionStatistics,
    extensionContext: ExtensionContext,
    extensionCounters: ExtensionCounters,
    @inject(OVERRIDERS_CONFIG)
    @optional()
    protected aOverriderConfig: OverriderConfig[] = [],
  ) {
    super(injector, systemLogMediator, counter, extensionContext, extensionCounters);
  }

  override async stage1<T>(ExtCls: ExtensionClass<T>): Promise<ExtensionGroupMeta<T>>;
  override async stage1<T>(ExtCls: ExtensionClass<T>, pendingExtension: Extension): Promise<PartialExtensionGroupMeta<T>>;
  override async stage1<T>(ExtCls: ExtensionClass<T>, pendingExtension?: Extension) {
    const extensionGroupMeta = await super.stage1<T>(ExtCls, pendingExtension as Extension);
    this.aOverriderConfig.forEach((overriderConfig) => {
      if (ExtCls === overriderConfig.ExtCls) {
        overriderConfig.override(extensionGroupMeta);
      }
    });
    return extensionGroupMeta;
  }
}
