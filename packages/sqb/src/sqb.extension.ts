import { Extension, ExtensionsManager, injectable } from '@ditsmod/core';
import { ROUTES_EXTENSIONS } from '@ditsmod/routing';

@injectable()
export class SqbExtension implements Extension<void> {
  constructor(protected extensionManager: ExtensionsManager) {}

  async stage1() {
    const totalInitMeta = await this.extensionManager.stage1(ROUTES_EXTENSIONS);
    totalInitMeta.groupInitMeta.forEach((initMeta) => {
      const { aControllerMetadata } = initMeta.payload;
      console.log('-'.repeat(50), initMeta.payload.meta.name);

      aControllerMetadata.forEach(({ providersPerRou, providersPerReq }) => {
        console.log(initMeta.payload.meta.providersPerMod, providersPerRou, providersPerReq);
      });
    });
  }
}
