import { Extension, ExtensionsManager, injectable, isInjectionToken } from '@ditsmod/core';
import { HTTP_INTERCEPTORS, ROUTES_EXTENSIONS } from '@ditsmod/routing';

@injectable()
export class UseInterceptorExtension implements Extension {
  constructor(protected extensionManager: ExtensionsManager) {}

  async stage1() {
    const stage1GroupMeta = await this.extensionManager.stage1(ROUTES_EXTENSIONS);

    for (const metadataPerMod3 of stage1GroupMeta.groupData) {
      for (const { providersPerRou, providersPerReq, interceptors } of metadataPerMod3.aControllerMetadata) {
        if (interceptors)
          for (const groupExtensionOrInterceptor of interceptors) {
            if (isInjectionToken(groupExtensionOrInterceptor)) {
              await this.extensionManager.stage1(groupExtensionOrInterceptor);
            } else {
              providersPerReq.push({ token: HTTP_INTERCEPTORS, useClass: groupExtensionOrInterceptor, multi: true });
            }
          }
      }
    }
  }
}
