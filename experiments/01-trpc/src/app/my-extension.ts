import { injectable, Extension, ExtensionsManager, PerAppService } from '@ditsmod/core';
import { TRPCError } from '@trpc/server';
import z from 'zod';

import { TRPC_OPTS } from '../adapters/ditsmod/constants.js';
import {
  TRPC_ROOT,
  t,
  TRPC_ROUTER,
  TRPC_PROCEDURE,
  TRPC_MERGE_ROUTERS,
  TRPC_CREATE_CALLER_FACTORY,
} from './root-rpc-object.js';
import { TrcpCreateCtxOpts, TrcpOpts } from '../adapters/ditsmod/types.js';

const router = t.router;
const publicProcedure = t.procedure;

// --------- create procedures etc

const postRouter = router({
  createPost: publicProcedure.input(z.object({ title: z.string() })).mutation(({ input }) => {
    const post = {
      id: ++id,
      ...input,
    };
    db.posts.push(post);
    return post;
  }),
  listPosts: publicProcedure.query(() => db.posts),
});

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

// root router to call
const appRouter = router({
  // merge predefined routers
  post: postRouter,
  message: messageRouter,
  // or individual procedures
  hello: publicProcedure.input(z.string().nullish()).query(({ input, ctx }) => {
    return `hello ${input ?? ctx.user?.name ?? 'world'}`;
  }),
  // or inline a router
  admin: router({
    secret: publicProcedure.query(({ ctx }) => {
      if (!ctx.user) {
        throw new TRPCError({ code: 'UNAUTHORIZED' });
      }
      if (ctx.user?.name !== 'alex') {
        throw new TRPCError({ code: 'FORBIDDEN' });
      }
      return {
        secret: 'sauce',
      };
    }),
  }),
});

export type AppRouter = typeof appRouter;

const createContext = ({ req, res }: TrcpCreateCtxOpts) => {
  const getUser = () => {
    if (req.headers.authorization !== 'secret') {
      return null;
    }
    return {
      name: 'alex',
    };
  };

  return {
    req,
    res,
    user: getUser(),
  };
};

export const trpcOpts: TrcpOpts = {
  router: appRouter,
  createContext,
};

@injectable()
export class MyExtension implements Extension<void> {
  constructor(
    private extensionsManager: ExtensionsManager,
    private perAppService: PerAppService,
  ) {}

  async stage1() {
    console.log('*'.repeat(20), 'MyExtension');
    this.setProviders();
  }

  protected setProviders() {
    this.perAppService.reinitInjector([
      { token: TRPC_ROOT, useValue: t },
      { token: TRPC_ROUTER, useValue: t.router },
      { token: TRPC_PROCEDURE, useValue: t.procedure },
      { token: TRPC_MERGE_ROUTERS, useValue: t.mergeRouters },
      { token: TRPC_CREATE_CALLER_FACTORY, useValue: t.createCallerFactory },
      { token: TRPC_OPTS, useValue: trpcOpts },
    ]);
  }
}
