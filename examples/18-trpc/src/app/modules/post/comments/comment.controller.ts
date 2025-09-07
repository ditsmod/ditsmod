import { controller, RouteService, trpcRoute } from '@ditsmod/trpc';
import { z } from 'zod';

import { DbService } from '#db/db.service.js';

@controller()
export class CommentController {
  @trpcRoute()
  createComment(routeService: RouteService, db: DbService) {
    return routeService.procedure.input(z.object({ title: z.string() })).mutation(({ input }) => {
      const comment = {
        id: ++db.commentId,
        ...input,
      };
      db.comments.push(comment);
      return comment;
    });
  }

  @trpcRoute()
  listComments(routeService: RouteService, db: DbService) {
    return routeService.procedure.query(() => db.comments);
  }
}
