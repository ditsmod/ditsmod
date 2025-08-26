import { Injector, rootModule } from '@ditsmod/core';
import { TrpcRootModule, TrpcService } from '@ditsmod/trpc';

import { PostModule } from '#modules/post/post.module.js';
import { AuthModule } from '#modules/auth/auth.module.js';
import { AuthService } from '#modules/auth/auth.service.js';
import { MessageModule } from '#modules/message/message.module.js';
import { AuthController } from './modules/auth/auth.controller.js';
import { MessageController } from './modules/message/message.controller.js';
import { PostController } from './modules/post/post.controller.js';

@rootModule({
  imports: [PostModule, AuthModule, MessageModule],
})
export class AppModule implements TrpcRootModule {
  constructor(
    private trpcService: TrpcService,
    private authService: AuthService,
    private inj: Injector,
  ) {}

  getAppRouter() {
    return this.trpcService.setOptionsAndGetAppRouter({
      basePath: '/trpc/',
      createContext: this.authService.createContext,
      routerConfig: {
        admin: this.inj.get(AuthController.prototype.getAdminRouter),
        post: this.inj.get(PostController.prototype.getPostRouter),
        message: this.inj.get(MessageController.prototype.getMessageRouter),
        hello: this.inj.get(MessageController.prototype.getHelloRouter),
      },
    });
  }
}
