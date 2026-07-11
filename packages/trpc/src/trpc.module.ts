import { ContextModule, featureModule } from '@ditsmod/core';

import { TrpcRouteExtension } from './extensions/trpc-route.extension.js';
import { TrpcPreRouterExtension } from './extensions/trpc-pre-router.extension.js';

@featureModule({
  imports: [ContextModule],
  exports: [ContextModule],
  extensions: [
    { extension: TrpcRouteExtension, beforeExtensions: [TrpcPreRouterExtension], exportOnly: true },
    { extension: TrpcPreRouterExtension, afterExtensions: [TrpcRouteExtension], exportOnly: true },
  ],
})
export class TrpcModule {}
