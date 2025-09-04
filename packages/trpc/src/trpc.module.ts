import { featureModule } from '@ditsmod/core';

import { TrpcRouteExtension } from './extensions/trpc-route.extension.js';
import { TrpcPreRouterExtension } from './extensions/trpc-pre-router.extension.js';

@featureModule({
  extensions: [
    { extension: TrpcRouteExtension, beforeExtensions: [TrpcPreRouterExtension], exportOnly: true },
    { extension: TrpcPreRouterExtension, afterExtensions: [TrpcRouteExtension], exportOnly: true },
  ],
})
export class TrpcModule {}
