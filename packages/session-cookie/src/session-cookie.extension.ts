import { Extension, ExtensionManager, injectable } from '@ditsmod/core';
import { HTTP_INTERCEPTORS, RestRouteExtension } from '@ditsmod/rest';

import { SessionCookieInterceptor } from './session-cookie.interceptor.js';

@injectable()
export class SessionCookieExtension implements Extension<void> {
  #inited: boolean;

  constructor(protected extensionManager: ExtensionManager) {}

  async stage1() {
    if (this.#inited) {
      return;
    }

    const extensionGroupMeta = await this.extensionManager.stage1(RestRouteExtension);
    extensionGroupMeta.groupData.forEach((routeExtensionMeta) => {
      routeExtensionMeta.controllersMeta.forEach(({ providersPerRou, scope }) => {
        if (scope == 'route') {
          providersPerRou.unshift(SessionCookieInterceptor);
          providersPerRou.push({ token: HTTP_INTERCEPTORS, useToken: SessionCookieInterceptor, multi: true });
        }
      });
    });

    this.#inited = true;
  }
}
