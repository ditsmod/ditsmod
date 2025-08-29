import { AnyObj } from '@ditsmod/core';
import type { TrpcService } from './trpc.service.js';

export interface TrpcRootModule {
  /**
   * For the root application module (AppModule), this method is automatically invoked by `@ditsmod/trpc`, expecting that within
   * it {@link TrpcService.setOptionsAndGetAppRouter | trpcService.setOptionsAndGetAppRouter()} will be called.
   * This method is also used by the tRPC client to obtain the data type (`AppRouter`) that it returns.
   */
  setAppRouter(trpcService: TrpcService): void;
}

export interface ModuleWithTrpcRoutes<Config extends AnyObj = AnyObj> {
  getRouterConfig(): Config;
}
