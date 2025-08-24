import { OnModuleInit, rootModule } from '@ditsmod/core';
import { TrpcRootModule, TrpcService } from '@ditsmod/trpc';

import { PostModule } from './post-module/post.module.js';
import { PostService } from './post-module/post.service.js';
import { AuthModule } from './auth-module/auth.module.js';
import { AuthService } from './auth-module/auth.service.js';
import { MessageModule } from './message-module/message.module.js';
import { MessageService } from './message-module/message.service.js';

@rootModule({
  imports: [PostModule, AuthModule, MessageModule],
})
export class AppModule implements OnModuleInit, TrpcRootModule {
  constructor(
    private trpcService: TrpcService,
    private messageService: MessageService,
    private postService: PostService,
    private authService: AuthService,
  ) {}

  onModuleInit(): void | Promise<void> {
    this.getAppRouter();
  }

  getAppRouter() {
    return this.trpcService.getAppRouter(
      {
        admin: this.authService.getAdminRouter(),
        post: this.postService.getPostRouter(),
        message: this.messageService.getMessageRouter(),
        hello: this.messageService.getHello(),
      },
      this.authService.createContext,
    );
  }
}
