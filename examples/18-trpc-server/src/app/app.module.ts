import { rootModule } from '@ditsmod/core';
import type { SetAppRouterOptions, TrpcCreateOptions, TrpcRootModule } from '@ditsmod/trpc';
import type { AppRouterHelper } from '@ditsmod/trpc/client';

import { PostModule } from '#post/post.module.js';
import { AuthModule } from '#auth/auth.module.js';
import { MessageModule } from '#message/message.module.js';

const modulesWithTrpcRoutes = [AuthModule, PostModule, MessageModule] as const;
export type AppRouter = AppRouterHelper<typeof modulesWithTrpcRoutes>;

@rootModule({
  imports: [...modulesWithTrpcRoutes],
})
export class AppModule implements TrpcRootModule {
  setTrpcCreateOptions(): TrpcCreateOptions {
    return {
      // Passing options for initTRPC.create()
    };
  }

  setAppRouterOptions(): SetAppRouterOptions {
    return {
      basePath: '/trpc/',
    };
  }
}
