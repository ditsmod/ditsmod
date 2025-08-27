import { Injector, rootModule } from '@ditsmod/core';
import { TrpcRootModule, TrpcService } from '@ditsmod/trpc';

import { PostModule } from '#modules/post/post.module.js';
import { AuthModule } from '#modules/auth/auth.module.js';
import { AuthService } from '#modules/auth/auth.service.js';
import { MessageModule } from '#modules/message/message.module.js';
import { TrpcRootObj } from './types.js';

const imports = [AuthModule, PostModule, MessageModule] as const;

@rootModule({
  imports: [...imports],
})
export class AppModule implements TrpcRootModule {
  constructor(private authService: AuthService) {}

  getAppRouter(trpcService: TrpcService, inj: Injector, t: TrpcRootObj) {
    return trpcService.setOptionsAndGetAppRouter({
      basePath: '/trpc/',
      createContext: this.authService.createContext,
      router: t.mergeRouters(...trpcService.getRouters(imports)),
    });
  }
}
