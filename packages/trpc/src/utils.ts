import { AnyRootTypes, BuiltRouter, RouterRecord } from '@trpc/server/unstable-core-do-not-import';
import { Injector } from '@ditsmod/core/di';

import type { TrpcService } from './trpc.service.js';

export interface TrpcRootModule {
  /**
   * This method is automatically invoked by `@ditsmod/trpc`, expecting that within
   * it {@link TrpcService.setOptionsAndGetAppRouter | trpcService.setOptionsAndGetAppRouter()} will be called.
   * This method is also used by the tRPC client to obtain the data type (`AppRouter`) that it returns.
   */
  getAppRouter<TRoot extends AnyRootTypes, TRecord extends RouterRecord>(
    trpcService: TrpcService,
    injector: Injector,
  ): BuiltRouter<TRoot, any>;
}
