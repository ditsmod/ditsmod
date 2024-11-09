import { injectable, Extension, ExtensionsManager, Logger } from '@ditsmod/core';
import { ROUTES_EXTENSIONS } from '@ditsmod/routing';

@injectable()
export class MyExtension implements Extension<void> {
  constructor(
    private extensionsManager: ExtensionsManager,
    private logger: Logger,
  ) {}

  async stage1() {
    const groupStage1Meta = await this.extensionsManager.stage1(ROUTES_EXTENSIONS);
    this.logger.log('info', groupStage1Meta.groupData[0].aControllerMetadata);
  }
}
