import { inspect } from 'node:util';
import { Extension, ExtensionsManager, injectable, isInjectionToken } from '@ditsmod/core';

import { RoutingErrorMediator } from '../router-error-mediator.js';
import { HTTP_INTERCEPTORS, ROUTES_EXTENSIONS } from '#mod/constants.js';
import { isInterceptor } from '#mod/type.guards.js';

@injectable()
export class UseInterceptorExtension implements Extension {
  constructor(
    protected extensionManager: ExtensionsManager,
    protected errorMediator: RoutingErrorMediator,
  ) {}

  async stage1() {
    const stage1GroupMeta = await this.extensionManager.stage1(ROUTES_EXTENSIONS);
    for (const metadataPerMod3 of stage1GroupMeta.groupData) {
      for (const meta of metadataPerMod3.aControllerMetadata) {
        if (meta.interceptors)
          for (const groupOrInterceptor of meta.interceptors) {
            if (isInjectionToken(groupOrInterceptor)) {
              await this.extensionManager.stage1(groupOrInterceptor);
            } else if (isInterceptor(groupOrInterceptor)) {
              const provider = { token: HTTP_INTERCEPTORS, useClass: groupOrInterceptor, multi: true };
              if (meta.scope == 'ctx') {
                meta.providersPerRou.push(provider);
              } else {
                meta.providersPerReq.push(provider);
              }
            } else {
              const whatIsThis = inspect(groupOrInterceptor, false, 3);
              this.errorMediator.invalidInterceptor(meta.httpMethods.join(', '), meta.path, whatIsThis);
            }
          }
      }
    }
  }
}
