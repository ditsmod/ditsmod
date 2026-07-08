import { inspect } from 'node:util';
import { Extension, ExtensionManager, injectable } from '@ditsmod/core';

import { HTTP_INTERCEPTORS } from '../top/constants.js';
import { isInterceptor } from '#types/type.guards.js';
import { RestRouteExtension } from './rest-route.extension.js';
import { InvalidInterceptor } from '#errors';

/**
 * Takes into account interceptors specified in controller methods,
 * for example: `@route('GET', 'some-path', [], [Interceptor1])`.
 */
@injectable()
export class UseInterceptorExtension implements Extension {
  constructor(protected extensionManager: ExtensionManager) {}

  async stage1() {
    const stage1ExtensionMeta = await this.extensionManager.stage1(RestRouteExtension);
    for (const metadataPerMod3 of stage1ExtensionMeta.groupData) {
      for (const ctrlMeta of metadataPerMod3.aControllerMetadata) {
        for (const Interceptor of ctrlMeta.interceptors) {
          if (isInterceptor(Interceptor)) {
            const provider = { token: HTTP_INTERCEPTORS, useClass: Interceptor, multi: true };
            if (ctrlMeta.scope == 'route') {
              ctrlMeta.providersPerRou.push(provider);
            } else {
              ctrlMeta.providersPerReq.push(provider);
            }
          } else {
            const whatIsThis = inspect(Interceptor, false, 3);
            throw new InvalidInterceptor(ctrlMeta.httpMethods.join(', '), ctrlMeta.fullPath, whatIsThis);
          }
        }
      }
    }
  }
}
