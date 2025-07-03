import { Extension, ExtensionsManager, injectable } from '@ditsmod/core';
import { RoutesExtension } from '@ditsmod/rest';

@injectable()
export class SqbExtension implements Extension<void> {
  constructor(protected extensionManager: ExtensionsManager) {}

  async stage1() {
    const stage1ExtensionMeta = await this.extensionManager.stage1(RoutesExtension);
    stage1ExtensionMeta.groupData.forEach((metadataPerMod3) => {
      const { aControllerMetadata } = metadataPerMod3;
      console.log('-'.repeat(50), metadataPerMod3.meta.name);

      aControllerMetadata.forEach(({ providersPerRou, providersPerReq }) => {
        console.log(metadataPerMod3.meta.providersPerMod, providersPerRou, providersPerReq);
      });
    });
  }
}
