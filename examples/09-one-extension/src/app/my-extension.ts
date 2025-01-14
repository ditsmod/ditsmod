import { injectable, Extension, ExtensionsManager, Logger } from '@ditsmod/core';
import { RoutesExtension } from '@ditsmod/routing';

@injectable()
export class MyExtension implements Extension<void> {
  constructor(
    private extensionsManager: ExtensionsManager,
    private logger: Logger,
  ) {}

  async stage1() {
    const stage1ExtensionMeta = await this.extensionsManager.stage1(RoutesExtension);
    this.logger.log('info', stage1ExtensionMeta.groupData[0].aControllerMetadata);
  }
}
