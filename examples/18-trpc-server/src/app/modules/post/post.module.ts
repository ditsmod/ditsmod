import { ModuleWithTrpcRoutes, trpcModule } from '@holu/trpc';
import { RouterOf } from '@holu/trpc/client';

import { PostController } from '#post/post.controller.js';
import { DbModule } from '#db/db.module.js';
import { CommentModule } from '#post/comments/comment.module.js';

// For TRPCClient
export type PostRouter = RouterOf<typeof PostModule>;

@trpcModule({
  imports: [DbModule, CommentModule],
  controllers: [PostController],
})
export class PostModule implements ModuleWithTrpcRoutes {
  getRouterConfig() {
    return {
      post: {
        createPost: PostController.prototype.createPost,
        listPosts: PostController.prototype.listPosts,
        comments: CommentModule.prototype.getRouterConfig,
      },
    };
  }
}
