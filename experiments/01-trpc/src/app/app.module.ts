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
  TrcpRouterFn,
  TrcpProcedureFn,
} from './root-rpc-object.js';
import { TrcpOpts } from '../adapter/types.js';
import { awaitTokens } from './utils.js';
import { PostService } from './post-module/post.service.js';
import { AuthModule } from './auth-module/auth.module.js';
import { AuthService } from './auth-module/auth.service.js';

const router = t.router;
const publicProcedure = t.procedure;

// --------- create procedures etc

let id = 0;

const db = {
  posts: [
    {
      id: ++id,
      title: 'hello',
    },
  ],
  messages: [createMessage('initial message')],
};
function createMessage(text: string) {
  const msg = {
    id: ++id,
    text,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  return msg;
}

const messageRouter = router({
  addMessage: publicProcedure.input(z.string()).mutation(({ input }) => {
    const msg = createMessage(input);
    db.messages.push(msg);

    return msg;
  }),
  listMessages: publicProcedure.query(() => db.messages),
});

@rootModule({
  imports: [PostModule, AuthModule],
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
export class AppModule implements OnModuleInit {
  constructor(
    private injectorPerMod: Injector,
    private preRouter: PreRouter,
    private postService: PostService,
    private authService: AuthService,
    @inject(TRPC_ROUTER) private router: TrcpRouterFn,
    @inject(TRPC_PROCEDURE) protected procedure: TrcpProcedureFn,
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
    return this.router({
      // merge predefined routers
      admin: this.authService.getAdminRouter(),
      post: this.postService.getPostRouter(),
      message: messageRouter,
      // or individual procedures
      hello: this.procedure.input(z.string().nullish()).query(({ input, ctx }) => {
        return `hello ${input ?? ctx.user?.name ?? 'world'}`;
      })
    });
  }
}
