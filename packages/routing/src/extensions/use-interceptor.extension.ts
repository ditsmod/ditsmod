import { inspect } from 'node:util';
import { Extension, ExtensionsManager, injectable, isInjectionToken } from '@ditsmod/core';
import { HTTP_INTERCEPTORS, isInterceptor, ROUTES_EXTENSIONS } from '@ditsmod/routing';

@injectable()
export class UseInterceptorExtension implements Extension {
  constructor(protected extensionManager: ExtensionsManager) {}

  async stage1() {
    const stage1GroupMeta = await this.extensionManager.stage1(ROUTES_EXTENSIONS);

    for (const metadataPerMod3 of stage1GroupMeta.groupData) {
      for (const { providersPerRou, providersPerReq, interceptors } of metadataPerMod3.aControllerMetadata) {
        if (interceptors)
          for (const groupOrInterceptor of interceptors) {
            if (isInjectionToken(groupOrInterceptor)) {
              await this.extensionManager.stage1(groupOrInterceptor);
            } else if (isInterceptor(groupOrInterceptor)) {
              providersPerReq.push({ token: HTTP_INTERCEPTORS, useClass: groupOrInterceptor, multi: true });
            } else {
              const whatIsThis = inspect(groupOrInterceptor, false, 3);
              let msg = 'The fourth parameter to the @route() decorator should be the HttpInterceptor ';
              msg += ` or extension group token, got: ${whatIsThis}.`;
              throw new TypeError(msg);
            }
          }
      }
    }
  }
}
