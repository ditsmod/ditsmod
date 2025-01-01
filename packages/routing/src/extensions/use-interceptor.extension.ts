import { inspect } from 'node:util';
import { Extension, ExtensionsManager, injectable, Injector, isInjectionToken } from '@ditsmod/core';

import { RoutingErrorMediator } from '../router-error-mediator.js';
import { HTTP_INTERCEPTORS, ROUTES_EXTENSIONS } from '#mod/constants.js';
import { isInterceptor } from '#mod/type.guards.js';

@injectable()
export class UseInterceptorExtension implements Extension {
  constructor(
    protected extensionManager: ExtensionsManager,
    protected errorMediator: RoutingErrorMediator,
    protected injector: Injector,
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
              if (this.injector.scope == 'Rou') {
                meta.providersPerRou.push({ token: HTTP_INTERCEPTORS, useClass: groupOrInterceptor, multi: true });
              } else {
                meta.providersPerReq.push({ token: HTTP_INTERCEPTORS, useClass: groupOrInterceptor, multi: true });
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
