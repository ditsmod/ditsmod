import { Extension, ExtensionManager, injectable } from '@ditsmod/core';
import { RestRouteExtension } from '@ditsmod/rest';

@injectable()
export class VersionsExtension implements Extension<void> {
  constructor(protected extensionManager: ExtensionManager) {}

  async stage1() {
    const extensionGroupMeta = await this.extensionManager.stage1(RestRouteExtension);
    extensionGroupMeta.groupData.forEach((metadataPerMod3) => {
      const { aControllerMetadata } = metadataPerMod3;
      console.log('-'.repeat(50), metadataPerMod3.meta);

      aControllerMetadata.forEach(({ providersPerRou, providersPerReq }) => {
        console.log(metadataPerMod3.meta.providersPerMod, providersPerRou, providersPerReq);
      });
    });
  }
}
