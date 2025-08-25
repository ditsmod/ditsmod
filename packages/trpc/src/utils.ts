import { AnyRootTypes, BuiltRouter, RouterRecord } from '@trpc/server/unstable-core-do-not-import';
import type { TrpcService } from './trpc.service.js';

export interface TrpcRootModule {
  /**
   * This method is automatically invoked by `@ditsmod/trpc`, expecting that within
   * it {@link TrpcService.setOptsAndGetAppRouter | trpcService.setOptsAndGetAppRouter()} will be called.
   * This method is also used by the tRPC client to obtain the data type (`AppRouter`) that it returns.
   */
  getAppRouter<TRoot extends AnyRootTypes, TRecord extends RouterRecord>(): BuiltRouter<TRoot, any>;
}
