import { ContextModule, featureModule } from '@ditsmod/core';

import { TrpcRouteExtension } from './extensions/trpc-route.extension.js';
import { TrpcRequestDispatcherExtension } from './extensions/trpc-pre-router.extension.js';

@featureModule({
  imports: [ContextModule],
  exports: [ContextModule],
  extensions: [
    { extension: TrpcRouteExtension, beforeExtensions: [TrpcRequestDispatcherExtension], exportOnly: true },
    { extension: TrpcRequestDispatcherExtension, afterExtensions: [TrpcRouteExtension], exportOnly: true },
  ],
})
export class TrpcModule {}
