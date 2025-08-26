import { injectable, Extension, ExtensionsManager, Logger, MetadataPerMod2 } from '@ditsmod/core';

import { TrpcMetadataPerMod2 } from '#init/trpc-deep-modules-importer.js';
import { initTrpc } from '#decorators/trpc-init-hooks-and-metadata.js';

@injectable()
export class MyExtension implements Extension<void> {
  constructor(
    private extensionsManager: ExtensionsManager,
    private logger: Logger,
    protected metadataPerMod2: MetadataPerMod2<TrpcMetadataPerMod2>,
  ) {}

  async stage1() {
    const restMetadataPerMod2 = this.metadataPerMod2.deepImportedModules.get(initTrpc)!;
    this.logger.log('info', restMetadataPerMod2);
  }
}
