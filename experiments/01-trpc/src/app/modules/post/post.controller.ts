import { controller, proc, TRPC_ROOT, trpcRoute } from '@ditsmod/trpc';
import { inject } from '@ditsmod/core';
import { z } from 'zod';

import { DbService } from '#modules/db/db.service.js';
import { TrpcProc, TrpcRootObj } from '#app/types.js';

@controller()
export class PostController {
  constructor(
    protected db: DbService,
    @inject(TRPC_ROOT) protected t: TrpcRootObj,
  ) {}

  @trpcRoute()
  getPostRouter(@proc('proc1') proc1: TrpcProc, @proc('proc2') proc2: TrpcProc) {
    return this.t.router({
      createPost: proc1.input(z.object({ title: z.string() })).mutation(({ input }) => {
        const post = {
          id: ++this.db.id,
          ...input,
        };
        this.db.posts.push(post);
        return post;
      }),
      listPosts: proc2.query(() => this.db.posts),
    });
  }
}
