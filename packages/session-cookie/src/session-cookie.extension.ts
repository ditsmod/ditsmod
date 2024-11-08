import { Extension, ExtensionsManager, HTTP_INTERCEPTORS, InjectionToken, injectable } from '@ditsmod/core';
import { ROUTES_EXTENSIONS } from '@ditsmod/routing';

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

    const groupStage1Meta = await this.extensionManager.stage1(ROUTES_EXTENSIONS);
    groupStage1Meta.aExtStage1Meta.forEach((stage1Meta) => {
      stage1Meta.payload.aControllerMetadata.forEach(({ providersPerRou, singletonPerScope }) => {
        if (singletonPerScope == 'module') {
          providersPerRou.unshift(SessionCookieInterceptor);
          providersPerRou.push({ token: HTTP_INTERCEPTORS, useToken: SessionCookieInterceptor, multi: true });
        }
      });
    });

    this.#inited = true;
  }
}
