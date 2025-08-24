import { inject, Injector, OnModuleInit, rootModule } from '@ditsmod/core';
import z from 'zod';

import { PostModule } from './post-module/post.module.js';
import { PreRouter } from '../adapter/pre-router.js';
import { TRPC_OPTS } from '../adapter/constants.js';
import {
  TRPC_ROOT,
  t,
  TRPC_ROUTER,
  TRPC_PROCEDURE,
  TRPC_MERGE_ROUTERS,
  TRPC_CREATE_CALLER_FACTORY,
} from './root-rpc-object.js';
import { TrcpOpts } from '../adapter/types.js';
import { awaitTokens, TrpcRootModule } from './utils.js';
import { PostService } from './post-module/post.service.js';
import { AuthModule } from './auth-module/auth.module.js';
import { AuthService } from './auth-module/auth.service.js';
import { MessageModule } from './message-module/message.module.js';
import { MessageService } from './message-module/message.service.js';

@rootModule({
  imports: [PostModule, AuthModule, MessageModule],
  providersPerApp: [
    PreRouter,
    { token: TRPC_ROOT, useValue: t },
    { token: TRPC_ROUTER, useValue: t.router },
    { token: TRPC_PROCEDURE, useValue: t.procedure },
    { token: TRPC_MERGE_ROUTERS, useValue: t.mergeRouters },
    { token: TRPC_CREATE_CALLER_FACTORY, useValue: t.createCallerFactory },
    ...awaitTokens(TRPC_OPTS),
  ],
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
