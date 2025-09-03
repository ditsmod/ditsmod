import { featureModule } from '@ditsmod/core';

import { TrpcRouteExtension } from './extensions/trpc-route.extension.js';
import { UseInterceptorExtension } from './extensions/use-interceptor.extension.js';

@featureModule({
  extensions: [
    { extension: TrpcRouteExtension, exportOnly: true },
    { extension: UseInterceptorExtension, afterExtensions: [TrpcRouteExtension], exportOnly: true },
  ],
})
export class TrpcModule {}
