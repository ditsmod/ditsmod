import { Injector, OnModuleInit, rootModule } from '@ditsmod/core';
import { PreRouter, TRPC_OPTS, TrcpOpts, t } from '@ditsmod/trpc';
import z from 'zod';

import { PostModule } from './post-module/post.module.js';
import { TrpcRootModule } from './utils.js';
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
    private injectorPerMod: Injector,
    private preRouter: PreRouter,
    private messageService: MessageService,
    private postService: PostService,
    private authService: AuthService,
  ) {}

  onModuleInit(): void | Promise<void> {
    this.init();
    this.preRouter.setTrpcRequestListener();
  }

  private init() {
    const injectorPerApp = this.injectorPerMod.parent!;
    injectorPerApp.setByToken(TRPC_OPTS, this.getTrcpOpts());
  }

  private getTrcpOpts(): TrcpOpts {
    return {
      router: this.getAppRouter(),
      createContext: this.authService.createContext,
    };
  }

  getAppRouter() {
    // root router to call
    return t.router({
      // merge predefined routers
      admin: this.authService.getAdminRouter(),
      post: this.postService.getPostRouter(),
      message: this.messageService.getMessageRouter(),
      // or individual procedures
      hello: t.procedure.input(z.string().nullish()).query(({ input, ctx }) => {
        return `hello ${input ?? ctx.user?.name ?? 'world'}`;
      }),
    });
  }
}
