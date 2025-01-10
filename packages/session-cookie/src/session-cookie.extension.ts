import { Extension, ExtensionsManager, InjectionToken, injectable } from '@ditsmod/core';
import { HTTP_INTERCEPTORS, ROUTE_EXTENSIONS } from '@ditsmod/routing';

import { SessionCookieInterceptor } from './session-cookie.interceptor.js';

export const SESSION_COOKIE_EXTENSIONS = new InjectionToken<Extension<void>[]>('SESSION_COOKIE_EXTENSIONS');

@injectable()
export class SessionCookieExtension implements Extension<void> {
  #inited: boolean;

  constructor(protected extensionManager: ExtensionsManager) {}

  async stage1() {
    if (this.#inited) {
      return;
    }

    const stage1GroupMeta = await this.extensionManager.stage1(ROUTE_EXTENSIONS);
    stage1GroupMeta.groupData.forEach((metadataPerMod3) => {
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
