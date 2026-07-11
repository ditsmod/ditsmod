import { Extension, ExtensionManager, injectable } from '@ditsmod/core';
import { RestRouteExtension } from '@ditsmod/rest';

@injectable()
export class VersionsExtension implements Extension<void> {
  constructor(protected extensionManager: ExtensionManager) {}

  async stage1() {
    const extensionGroupMeta = await this.extensionManager.stage1(RestRouteExtension);
    extensionGroupMeta.groupData.forEach((routeExtensionMeta) => {
      const { aControllerMetadata } = routeExtensionMeta;
      console.log('-'.repeat(50), routeExtensionMeta.meta);

      aControllerMetadata.forEach(({ providersPerRou, providersPerReq }) => {
        console.log(routeExtensionMeta.meta.providersPerMod, providersPerRou, providersPerReq);
      });
    });
  }
}
