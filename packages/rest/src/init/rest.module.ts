import { BaseAppOptions, featureModule } from '@ditsmod/core';

import { DefaultRouter, Router } from '#services/router.js';
import { RoutesExtension } from '#extensions/routes.extension.js';
import { PreRouterExtension } from '#extensions/pre-router.extension.js';
import { UseInterceptorExtension } from '#extensions/use-interceptor.extension.js';
import { AppOptions } from '#types/app-options.js';
import { RequestContext } from '#services/request-context.js';
import { PreRouter } from '#services/pre-router.js';

/**
 * Sets `Router` provider on application level, and adds `RoutesExtension` with `PreRouterExtension`.
 */
@featureModule({
  providersPerApp: [
    { token: Router, useClass: DefaultRouter },
    { token: AppOptions, useToken: BaseAppOptions },
    { token: RequestContext, useValue: RequestContext },
    PreRouter,
  ],
  extensions: [
    { extension: RoutesExtension, beforeExtensions: [PreRouterExtension], exportOnly: true },
    { extension: PreRouterExtension, afterExtensions: [RoutesExtension], exportOnly: true },
    {
      extension: UseInterceptorExtension,
      afterExtensions: [RoutesExtension],
      beforeExtensions: [PreRouterExtension],
      exportOnly: true,
    },
  ],
})
export class RestModule {}
