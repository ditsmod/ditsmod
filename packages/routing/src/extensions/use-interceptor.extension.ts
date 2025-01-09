import { inspect } from 'node:util';
import { Extension, ExtensionsManager, injectable } from '@ditsmod/core';

import { RoutingErrorMediator } from '../router-error-mediator.js';
import { HTTP_INTERCEPTORS, ROUTES_EXTENSIONS } from '#mod/constants.js';
import { isInterceptor } from '#mod/type.guards.js';

/**
 * A group of extensions that allows you to set the order of launching different interceptors.
 */
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
          for (const interceptor of meta.interceptors) {
            if (isInterceptor(interceptor)) {
              const provider = { token: HTTP_INTERCEPTORS, useClass: interceptor, multi: true };
              if (meta.scope == 'ctx') {
                meta.providersPerRou.push(provider);
              } else {
                meta.providersPerReq.push(provider);
              }
            } else {
              const whatIsThis = inspect(interceptor, false, 3);
              this.errorMediator.invalidInterceptor(meta.httpMethods.join(', '), meta.fullPath, whatIsThis);
            }
          }
      }
    }
  }
}
