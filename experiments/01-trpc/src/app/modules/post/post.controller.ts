import { controller, proc, TRPC_ROOT, trpcRoute } from '@ditsmod/trpc';
import { inject } from '@ditsmod/core';
import { z } from 'zod';

import { DbService } from '#modules/db/db.service.js';
import { TrpcProc, TrpcRootObj } from '#app/types.js';

@controller()
export class PostController {
  @trpcRoute()
  getPostRouter(
    @inject(TRPC_ROOT) t: TrpcRootObj,
    @proc() proc1: TrpcProc,
    @proc() proc2: TrpcProc,
    db: DbService,
  ) {
    return t.router({
      createPost: proc1.input(z.object({ title: z.string() })).mutation(({ input }) => {
        const post = {
          id: ++db.id,
          ...input,
        };
        db.posts.push(post);
        return post;
      }),
      listPosts: proc2.query(() => db.posts),
    });
  }
}
