import { rootModule } from '@ditsmod/core';
import type { SetAppRouterOptions, TrpcCreateOptions, TrpcRootModule } from '@ditsmod/trpc';
import type { AppRouterHelper } from '@ditsmod/trpc/client';

import { PostModule } from '#post/post.module.js';
import { AuthModule } from '#auth/auth.module.js';
import { AuthService } from '#auth/auth.service.js';
import { MessageModule } from '#message/message.module.js';

const modulesWithTrpcRoutes = [AuthModule, PostModule, MessageModule] as const;
export type AppRouter = AppRouterHelper<typeof modulesWithTrpcRoutes>;

@rootModule({
  imports: [...modulesWithTrpcRoutes],
})
export class AppModule implements TrpcRootModule {
  constructor(private authService: AuthService) {}

  setTrpcCreateOptions(): TrpcCreateOptions {
    return { defaultMeta: {} };
  }

  setAppRouter(): SetAppRouterOptions {
    return {
      basePath: '/trpc/',
      createContext: this.authService.createContext,
    };
  }
}
