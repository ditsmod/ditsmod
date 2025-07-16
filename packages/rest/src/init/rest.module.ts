import { BaseAppOptions, featureModule } from '@ditsmod/core';

import { DefaultRouter, Router } from '#services/router.js';
import { RestErrorMediator } from '#services/router-error-mediator.js';
import { RoutesExtension } from '#extensions/routes.extension.js';
import { PreRouterExtension } from '#extensions/pre-router.extension.js';
import { RouteMeta } from '#types/route-data.js';
import { UseInterceptorExtension } from '#extensions/use-interceptor.extension.js';
import { addRest } from '#decorators/rest-init-hooks-and-metadata.js';
import { AppOptions } from '#types/app-options.js';
import { RequestContext } from '#services/request-context.js';
import { PreRouter } from '#services/pre-router.js';

/**
 * Sets `Router` provider on application level, and adds `RoutesExtension` with `PreRouterExtension`.
 */
@addRest({
  providersPerRou: [
    RouteMeta, // In fact, the provider with this token is added dynamically. This requires `DeepModulesImporter`.
  ],
  exports: [RouteMeta],
})
@featureModule({
  providersPerApp: [
    { token: Router, useClass: DefaultRouter },
    { token: AppOptions, useToken: BaseAppOptions },
    { token: RequestContext, useValue: RequestContext },
    PreRouter,
    RestErrorMediator,
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
