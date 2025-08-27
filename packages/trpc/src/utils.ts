import { AnyRootTypes, BuiltRouter } from '@trpc/server/unstable-core-do-not-import';
import { AnyObj, Injector } from '@ditsmod/core';

import type { TrpcService } from './trpc.service.js';

export interface TrpcRootModule {
  /**
   * This method is automatically invoked by `@ditsmod/trpc`, expecting that within
   * it {@link TrpcService.setOptionsAndGetAppRouter | trpcService.setOptionsAndGetAppRouter()} will be called.
   * This method is also used by the tRPC client to obtain the data type (`AppRouter`) that it returns.
   */
  getAppRouter<TRoot extends AnyRootTypes>(trpcService: TrpcService): BuiltRouter<TRoot, any>;
}

export interface ModuleWithTrpcRoutes<Config extends AnyObj = AnyObj> {
  getRouterConfig(): Config;
}
