import { BaseAppOptions, Context, ContextModule, featureModule, getTokens } from '@ditsmod/core';

import { DefaultRouter, Router } from '#services/router.js';
import { RestRouteExtension } from '#extensions/rest-route.extension.js';
import { DispatcherExtension } from '#extensions/pre-router.extension.js';
import { UseInterceptorExtension } from '#extensions/use-interceptor.extension.js';
import { AppOptions } from '#types/app-options.js';
import { RequestDispatcher } from '#services/pre-router.js';
import { defaultProvidersPerReq } from '#providers/default-providers-per-req.js';
import { defaultProvidersPerRou } from '#providers/default-providers-per-rou.js';
import { RouteContext } from '#services/route-context.js';
import { RequestContext } from '#services/request-context.js';

/**
 * Sets `Router` provider on application level, and adds `RestRouteExtension` with `DispatcherExtension`.
 */
@featureModule({
  imports: [ContextModule],
  providersPerApp: [
    { token: Router, useClass: DefaultRouter },
    { token: AppOptions, useToken: BaseAppOptions },
    { token: RouteContext, useValue: RouteContext },
    RequestDispatcher,
  ],
  providersPerRou: [...defaultProvidersPerRou],
  providersPerReq: [...defaultProvidersPerReq, RequestContext, { token: Context, useToken: RequestContext }],
  exports: [ContextModule, RequestContext, Context, ...getTokens(defaultProvidersPerRou.concat(defaultProvidersPerReq))],
  extensions: [
    { extension: RestRouteExtension, beforeExtensions: [DispatcherExtension], exportOnly: true },
    { extension: DispatcherExtension, afterExtensions: [RestRouteExtension], exportOnly: true },
    {
      extension: UseInterceptorExtension,
      afterExtensions: [RestRouteExtension],
      beforeExtensions: [DispatcherExtension],
      exportOnly: true,
    },
  ],
})
export class RestModule {}
