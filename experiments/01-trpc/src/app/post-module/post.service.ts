import { inject, injectable } from '@ditsmod/core';
import { z } from 'zod';

import { TrcpProcedureFn, TrcpRouterFn, TRPC_PROCEDURE, TRPC_ROUTER } from '#app/root-rpc-object.js';
import { Db } from './db.js';

@injectable()
export class PostService {
  constructor(
    protected db: Db,
    @inject(TRPC_ROUTER) protected router: TrcpRouterFn,
    @inject(TRPC_PROCEDURE) protected procedure: TrcpProcedureFn,
  ) {}

  getPostRouter() {
    return this.router({
      createPost: this.procedure.input(z.object({ title: z.string() })).mutation(({ input }) => {
        const post = {
          id: ++this.db.id,
          ...input,
        };
        this.db.posts.push(post);
        return post;
      }),
      listPosts: this.procedure.query(() => this.db.posts),
    });
  }
}
