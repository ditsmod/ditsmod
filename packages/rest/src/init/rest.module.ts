import { BaseAppOptions, featureModule, getTokens } from '@ditsmod/core';

import { DefaultRouter, Router } from '#services/router.js';
import { RouteExtension } from '#extensions/routes.extension.js';
import { PreRouterExtension } from '#extensions/pre-router.extension.js';
import { UseInterceptorExtension } from '#extensions/use-interceptor.extension.js';
import { AppOptions } from '#types/app-options.js';
import { RequestContext } from '#services/request-context.js';
import { PreRouter } from '#services/pre-router.js';
import { defaultProvidersPerReq } from '#providers/default-providers-per-req.js';
import { defaultProvidersPerRou } from '#providers/default-providers-per-rou.js';

/**
 * Sets `Router` provider on application level, and adds `RouteExtension` with `PreRouterExtension`.
 */
@featureModule({
  providersPerApp: [
    { token: Router, useClass: DefaultRouter },
    { token: AppOptions, useToken: BaseAppOptions },
    { token: RequestContext, useValue: RequestContext },
    PreRouter,
  ],
  providersPerRou: [...defaultProvidersPerRou],
  providersPerReq: [...defaultProvidersPerReq],
  exports: [...getTokens(defaultProvidersPerRou.concat(defaultProvidersPerReq))],
  extensions: [
    { extension: RouteExtension, beforeExtensions: [PreRouterExtension], exportOnly: true },
    { extension: PreRouterExtension, afterExtensions: [RouteExtension], exportOnly: true },
    {
      extension: UseInterceptorExtension,
      afterExtensions: [RouteExtension],
      beforeExtensions: [PreRouterExtension],
      exportOnly: true,
    },
  ],
})
export class RestModule {}
