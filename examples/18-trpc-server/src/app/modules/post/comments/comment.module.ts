import { initTrpcModule, ModuleWithTrpcRoutes } from '@ditsmod/trpc';

import { CommentController } from '#comments/comment.controller.js';
import { DbModule } from '#app/modules/db/db.module.js';

@initTrpcModule({
  imports: [DbModule],
  controllers: [CommentController],
})
export class CommentModule implements ModuleWithTrpcRoutes {
  getRouterConfig() {
    return {
      createComment: CommentController.prototype.createComment,
      listComments: CommentController.prototype.listComments,
    };
  }
}
