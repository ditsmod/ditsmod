import { featureModule } from '@ditsmod/core';

import { TrpcExtension } from './extensions/trpc-extension.js';
import { UseInterceptorExtension } from './extensions/use-interceptor.extension.js';

@featureModule({
  extensions: [
    { extension: TrpcExtension, exportOnly: true },
    { extension: UseInterceptorExtension, afterExtensions: [TrpcExtension], exportOnly: true },
  ],
})
export class TrpcModule {}
