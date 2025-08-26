import { Injector, rootModule } from '@ditsmod/core';
import { TrpcRootModule, TrpcService } from '@ditsmod/trpc';

import { PostModule } from '#modules/post/post.module.js';
import { AuthModule } from '#modules/auth/auth.module.js';
import { AuthService } from '#modules/auth/auth.service.js';
import { MessageModule } from '#modules/message/message.module.js';
import { AuthController } from '#modules/auth/auth.controller.js';
import { MessageController } from '#modules/message/message.controller.js';
import { PostController } from '#modules/post/post.controller.js';

@rootModule({
  imports: [PostModule, AuthModule, MessageModule],
})
export class AppModule implements TrpcRootModule {
  constructor(private authService: AuthService) {}

  getAppRouter(trpcService: TrpcService, inj: Injector) {
    return trpcService.setOptionsAndGetAppRouter({
      basePath: '/trpc/',
      createContext: this.authService.createContext,
      routerConfig: {
        admin: inj.get(AuthController.prototype.getAdminRouter),
        post: inj.get(PostController.prototype.getPostRouter),
        message: inj.get(MessageController.prototype.getMessageRouter),
        hello: inj.get(MessageController.prototype.getHelloRouter),
      },
    });
  }
}
