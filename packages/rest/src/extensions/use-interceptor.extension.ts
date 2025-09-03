import { inspect } from 'node:util';
import { Extension, ExtensionsManager, injectable } from '@ditsmod/core';

import { HTTP_INTERCEPTORS } from '#types/constants.js';
import { isInterceptor } from '#types/type.guards.js';
import { RoutesExtension } from './routes.extension.js';
import { InvalidInterceptor } from '#errors';

/**
 * A group of extensions that allows you to set the order of launching different interceptors.
 */
@injectable()
export class UseInterceptorExtension implements Extension {
  constructor(protected extensionManager: ExtensionsManager) {}

  async stage1() {
    const stage1ExtensionMeta = await this.extensionManager.stage1(RoutesExtension);
    for (const metadataPerMod3 of stage1ExtensionMeta.groupData) {
      for (const ctrlMeta of metadataPerMod3.aControllerMetadata) {
        for (const Interceptor of ctrlMeta.interceptors) {
          if (isInterceptor(Interceptor)) {
            const provider = { token: HTTP_INTERCEPTORS, useClass: Interceptor, multi: true };
            if (ctrlMeta.scope == 'ctx') {
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
