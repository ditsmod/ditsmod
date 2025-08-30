import { rootModule } from '@ditsmod/core';
import { AppRouterHelper, SetAppRouterOptions, TrpcRootModule } from '@ditsmod/trpc';

import { PostModule } from '#modules/post/post.module.js';
import { AuthModule } from '#modules/auth/auth.module.js';
import { AuthService } from '#modules/auth/auth.service.js';
import { MessageModule } from '#modules/message/message.module.js';

const modulesWithTrpcRoutes = [AuthModule, PostModule, MessageModule] as const;
export type AppRouter = AppRouterHelper<typeof modulesWithTrpcRoutes>;

@rootModule({
  imports: [...modulesWithTrpcRoutes],
})
export class AppModule implements TrpcRootModule {
  constructor(private authService: AuthService) {}

  setAppRouter(): SetAppRouterOptions {
    return {
      basePath: '/trpc/',
      createContext: this.authService.createContext,
    };
  }
}
