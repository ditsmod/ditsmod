import { Extension, ExtensionsManager, injectable } from '@ditsmod/core';
import { BODY_PARSER_EXTENSIONS } from '@ditsmod/body-parser';
import { HTTP_INTERCEPTORS, ROUTES_EXTENSIONS } from '@ditsmod/routing';

import { AuthjsInterceptor } from './authjs.interceptor.js';

@injectable()
export class AuthjsExtension implements Extension {
  constructor(protected extensionManager: ExtensionsManager) {}

  async stage1() {
    const stage1GroupMeta = await this.extensionManager.stage1(ROUTES_EXTENSIONS);
    await this.extensionManager.stage1(BODY_PARSER_EXTENSIONS);

    stage1GroupMeta.groupData.forEach((metadataPerMod3) => {
      const { aControllerMetadata } = metadataPerMod3;
      aControllerMetadata.forEach(({ providersPerRou, providersPerReq, httpMethod, path, scope }) => {
        const httpMethods = Array.isArray(httpMethod) ? httpMethod : [httpMethod];
        httpMethods.forEach((method) => {
          if (scope == 'ctx') {
            // providersPerRou.push({ token: HTTP_INTERCEPTORS, useClass: AuthjsInterceptor, multi: true });
          } else {
            if (path == 'auth/:action' || path == 'auth/:action/:providerType') {
              providersPerReq.push({ token: HTTP_INTERCEPTORS, useClass: AuthjsInterceptor, multi: true });
            }
          }
        });
      });
    });
  }
}
