import { controller, proc } from '@ditsmod/trpc';
import { z } from 'zod';

import { DbService } from '#modules/db/db.service.js';
import { TrpcProc } from '#app/types.js';

@controller()
export class CommentController {
  createComment(@proc() proc: TrpcProc, db: DbService) {
    return proc.input(z.object({ title: z.string() })).mutation(({ input }) => {
      const comment = {
        id: ++db.commentId,
        ...input,
      };
      db.comments.push(comment);
      return comment;
    });
  }

  listComments(@proc() proc: TrpcProc, db: DbService) {
    return proc.query(() => db.comments);
  }
}
