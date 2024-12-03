import { injectable, Extension, ExtensionsManager, Logger } from '@ditsmod/core';
import { ROUTES_EXTENSIONS } from '@ditsmod/routing';

@injectable()
export class MyExtension implements Extension<void> {
  constructor(
    private extensionsManager: ExtensionsManager,
    private logger: Logger,
  ) {}

  async stage1() {
    const stage1GroupMeta = await this.extensionsManager.stage1(ROUTES_EXTENSIONS);
    this.logger.log('info', stage1GroupMeta.groupData[0].aControllerMetadata);
  }
}
