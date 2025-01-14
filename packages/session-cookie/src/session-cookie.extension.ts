import { Extension, ExtensionsManager, injectable } from '@ditsmod/core';
import { HTTP_INTERCEPTORS, RoutesExtension } from '@ditsmod/routing';

import { SessionCookieInterceptor } from './session-cookie.interceptor.js';

@injectable()
export class SessionCookieExtension implements Extension<void> {
  #inited: boolean;

  constructor(protected extensionManager: ExtensionsManager) {}

  async stage1() {
    if (this.#inited) {
      return;
    }

    const stage1ExtensionMeta = await this.extensionManager.stage1(RoutesExtension);
    stage1ExtensionMeta.groupData.forEach((metadataPerMod3) => {
      metadataPerMod3.aControllerMetadata.forEach(({ providersPerRou, scope }) => {
        if (scope == 'ctx') {
          providersPerRou.unshift(SessionCookieInterceptor);
          providersPerRou.push({ token: HTTP_INTERCEPTORS, useToken: SessionCookieInterceptor, multi: true });
        }
      });
    });

    this.#inited = true;
  }
}
