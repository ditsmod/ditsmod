import { Injectable } from '@ts-stack/di';
import { edk, Logger } from '@ditsmod/core';

@Injectable()
export class MyExtension implements edk.Extension<void> {
  #inited: boolean;

  constructor(
    private extensionsManager: edk.ExtensionsManager,
    private logger: Logger
  ) {}

  async init() {
    if (this.#inited) {
      return;
    }

    const aMetadataPerMod2 = await this.extensionsManager.init(edk.ROUTES_EXTENSIONS);
    this.logger.info(aMetadataPerMod2);

    this.#inited = true;
  }
}
