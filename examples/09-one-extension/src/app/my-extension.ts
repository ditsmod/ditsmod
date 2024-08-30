import { injectable, Extension, ExtensionsManager, Logger } from '@ditsmod/core';
import { ROUTES_EXTENSIONS } from '@ditsmod/routing';

@injectable()
export class MyExtension implements Extension<void> {
  #inited: boolean;

  constructor(
    private extensionsManager: ExtensionsManager,
    private logger: Logger
  ) {}

  async init() {
    if (this.#inited) {
      return;
    }

    const totalInitMeta = await this.extensionsManager.init(ROUTES_EXTENSIONS);
    this.logger.log('info', totalInitMeta.groupInitMeta[0].payload.aControllersMetadata2);

    this.#inited = true;
  }
}
