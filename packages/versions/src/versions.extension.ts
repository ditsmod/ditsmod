import { Extension, ExtensionManager, injectable } from '@holu/core';
import { RestRouteExtension } from '@holu/rest';

@injectable()
export class VersionsExtension implements Extension<void> {
  constructor(protected extensionManager: ExtensionManager) {}

  async stage1() {
    const extensionGroupMeta = await this.extensionManager.stage1(RestRouteExtension);
    extensionGroupMeta.groupData.forEach((routeExtensionMeta) => {
      const { controllersMeta } = routeExtensionMeta;
      console.log('-'.repeat(50), routeExtensionMeta.meta);

      controllersMeta.forEach(({ providersPerRou, providersPerReq }) => {
        console.log(routeExtensionMeta.meta.providersPerMod, providersPerRou, providersPerReq);
      });
    });
  }
}
