import { controller, proc, trpcRoute } from '@ditsmod/trpc';
import { z } from 'zod';

import { DbService } from '#modules/db/db.service.js';
import { TrpcProc } from '#app/types.js';

@controller()
export class PostController {
  @trpcRoute()
  createPost(@proc() proc: TrpcProc, db: DbService) {
    return proc.input(z.object({ title: z.string() })).mutation(({ input }) => {
      const post = {
        id: ++db.id,
        ...input,
      };
      db.posts.push(post);
      return post;
    });
  }

  @trpcRoute()
  listPosts(@proc() proc: TrpcProc, db: DbService) {
    return proc.query(() => db.posts);
  }
}
