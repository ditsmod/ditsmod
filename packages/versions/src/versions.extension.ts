import { Extension, ExtensionsManager, injectable } from '@ditsmod/core';
import { ROUTES_EXTENSIONS } from '@ditsmod/routing';

@injectable()
export class VersionsExtension implements Extension<void> {
  constructor(protected extensionManager: ExtensionsManager) {}

  async init() {
    const totalInitMeta = await this.extensionManager.init(ROUTES_EXTENSIONS);
    totalInitMeta.groupInitMeta.forEach((initMeta) => {
      const { aControllersMetadata2, providersPerMod } = initMeta.payload;
      console.log('-'.repeat(50), initMeta.payload.moduleName);

      aControllersMetadata2.forEach(({ providersPerRou, providersPerReq }) => {
        console.log(providersPerMod, providersPerRou, providersPerReq);
      });
    });
  }
}
