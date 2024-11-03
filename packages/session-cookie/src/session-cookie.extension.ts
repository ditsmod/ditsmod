import { Extension, ExtensionsManager, HTTP_INTERCEPTORS, InjectionToken, injectable } from '@ditsmod/core';
import { ROUTES_EXTENSIONS } from '@ditsmod/routing';

import { SessionCookieInterceptor } from './session-cookie.interceptor.js';

export const SESSION_COOKIE_EXTENSIONS = new InjectionToken<Extension<void>[]>('SESSION_COOKIE_EXTENSIONS');

@injectable()
export class SessionCookieExtension implements Extension<void> {
  #inited: boolean;

  constructor(protected extensionManager: ExtensionsManager) {}

  async init() {
    if (this.#inited) {
      return;
    }

    const totalInitMeta = await this.extensionManager.init(ROUTES_EXTENSIONS);
    totalInitMeta.groupInitMeta.forEach((initMeta) => {
      initMeta.payload.aControllerMetadata.forEach(({ providersPerRou, singleton }) => {
        if (singleton) {
          providersPerRou.unshift(SessionCookieInterceptor);
          providersPerRou.push({ token: HTTP_INTERCEPTORS, useToken: SessionCookieInterceptor, multi: true });
        }
      });
    });

    this.#inited = true;
  }
}
