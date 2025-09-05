import { featureModule } from '@ditsmod/core';

import { TrpcRouteExtension } from './extensions/trpc-route.extension.js';
import { TrpcPreRouterExtension } from './extensions/trpc-pre-router.extension.js';
import { RequestContext } from '#services/request-context.js';

@featureModule({
  providersPerApp: [{ token: RequestContext, useValue: RequestContext }],
  extensions: [
    { extension: TrpcRouteExtension, beforeExtensions: [TrpcPreRouterExtension], exportOnly: true },
    { extension: TrpcPreRouterExtension, afterExtensions: [TrpcRouteExtension], exportOnly: true },
  ],
})
export class TrpcModule {}
