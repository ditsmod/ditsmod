import { Extension, ExtensionsManager, injectable } from '@ditsmod/core';
import { ROUTE_EXTENSIONS } from '@ditsmod/routing';

@injectable()
export class VersionsExtension implements Extension<void> {
  constructor(protected extensionManager: ExtensionsManager) {}

  async stage1() {
    const stage1GroupMeta = await this.extensionManager.stage1(ROUTE_EXTENSIONS);
    stage1GroupMeta.groupData.forEach((metadataPerMod3) => {
      const { aControllerMetadata } = metadataPerMod3;
      console.log('-'.repeat(50), metadataPerMod3.meta.name);

      aControllerMetadata.forEach(({ providersPerRou, providersPerReq }) => {
        console.log(metadataPerMod3.meta.providersPerMod, providersPerRou, providersPerReq);
      });
    });
  }
}
