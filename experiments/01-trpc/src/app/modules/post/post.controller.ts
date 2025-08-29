import { controller, proc } from '@ditsmod/trpc';
import { z } from 'zod';

import { DbService } from '#modules/db/db.service.js';
import { TrpcProc } from '#app/types.js';

@controller()
export class PostController {
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

  listPosts(@proc() proc: TrpcProc, db: DbService) {
    return proc.query(() => db.posts);
  }
}
