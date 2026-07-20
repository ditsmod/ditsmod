import { injectable, Extension, ExtensionManager, Logger } from '@ditsmod/core';
import { RestRouteExtension } from '@ditsmod/rest';

@injectable()
export class MyExtension implements Extension<void> {
  constructor(
    private extensionManager: ExtensionManager,
    private logger: Logger,
  ) {}

  async stage1() {
    const extensionGroupMeta = await this.extensionManager.stage1(RestRouteExtension);
    this.logger.log('info', extensionGroupMeta.groupData[0].aControllerMeta);
  }
}
