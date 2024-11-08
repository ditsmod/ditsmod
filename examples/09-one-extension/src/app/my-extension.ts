import { injectable, Extension, ExtensionsManager, Logger } from '@ditsmod/core';
import { ROUTES_EXTENSIONS } from '@ditsmod/routing';

@injectable()
export class MyExtension implements Extension<void> {
  #inited: boolean;

  constructor(
    private extensionsManager: ExtensionsManager,
    private logger: Logger,
  ) {}

  async stage1() {
    if (this.#inited) {
      return;
    }

    const totalStage1Meta = await this.extensionsManager.stage1(ROUTES_EXTENSIONS);
    this.logger.log('info', totalStage1Meta.groupStage1Meta[0].payload.aControllerMetadata);

    this.#inited = true;
  }
}
