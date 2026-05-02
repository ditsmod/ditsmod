import { injectable, Extension, ExtensionManager, Logger } from '@ditsmod/core';
import { RouteExtension } from '@ditsmod/rest';

@injectable()
export class MyExtension implements Extension<void> {
  constructor(
    private extensionManager: ExtensionManager,
    private logger: Logger,
  ) {}

  async stage1() {
    const stage1ExtensionMeta = await this.extensionManager.stage1(RouteExtension);
    this.logger.log('info', stage1ExtensionMeta.groupData[0].aControllerMetadata);
  }
}
