import { rootModule } from '@ditsmod/core';
import { TrpcRootModule, TrpcService } from '@ditsmod/trpc';

import { PostModule } from './modules/post/post.module.js';
import { PostService } from './modules/post/post.service.js';
import { AuthModule } from './modules/auth/auth.module.js';
import { AuthService } from './modules/auth/auth.service.js';
import { MessageModule } from './modules/message/message.module.js';
import { MessageService } from './modules/message/message.service.js';

@rootModule({
  imports: [PostModule, AuthModule, MessageModule],
})
export class AppModule implements TrpcRootModule {
  constructor(
    private trpcService: TrpcService,
    private authService: AuthService,
    private postService: PostService,
    private messageService: MessageService,
  ) {}

  getAppRouter() {
    return this.trpcService.setOptionsAndGetAppRouter({
      basePath: '/trpc/',
      createContext: this.authService.createContext,
      routerConfig: {
        admin: this.authService.getAdminRouter(),
        post: this.postService.getPostRouter(),
        message: this.messageService.getMessageRouter(),
        hello: this.messageService.getHelloRouter(),
      },
    });
  }
}
