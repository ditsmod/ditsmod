import { Extension, ExtensionsManager, injectable } from '@ditsmod/core';
import { ROUTES_EXTENSIONS } from '@ditsmod/routing';

@injectable()
export class VersionsExtension implements Extension<void> {
  constructor(protected extensionManager: ExtensionsManager) {}

  async stage1() {
    const groupStage1Meta = await this.extensionManager.stage1(ROUTES_EXTENSIONS);
    groupStage1Meta.aExtStage1Meta.forEach((stage1Meta) => {
      const { aControllerMetadata } = stage1Meta.payload;
      console.log('-'.repeat(50), stage1Meta.payload.meta.name);

      aControllerMetadata.forEach(({ providersPerRou, providersPerReq }) => {
        console.log(stage1Meta.payload.meta.providersPerMod, providersPerRou, providersPerReq);
      });
    });
  }
}
