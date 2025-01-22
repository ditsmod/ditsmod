import {
  ExtensionCounters,
  ExtensionsContext,
  ExtensionClass,
  inject,
  injectable,
  Injector,
  optional,
  Stage1ExtensionMeta,
  Stage1ExtensionMeta2,
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

  override async stage1<T>(ExtCls: ExtensionClass<T>): Promise<Stage1ExtensionMeta<T>>;
  override async stage1<T>(ExtCls: ExtensionClass<T>, pendingExtension: Extension): Promise<Stage1ExtensionMeta2<T>>;
  override async stage1<T>(ExtCls: ExtensionClass<T>, pendingExtension?: Extension) {
    const stage1ExtensionMeta = await super.stage1<T>(ExtCls, pendingExtension as Extension);
    this.aOverriderConfig.forEach((overriderConfig) => {
      if (ExtCls === overriderConfig.ExtCls) {
        overriderConfig.override(stage1ExtensionMeta);
      }
    });
    return stage1ExtensionMeta;
  }
}
