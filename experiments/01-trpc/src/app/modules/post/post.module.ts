import { featureModule } from '@ditsmod/core';
import { initTrpcModule, ModuleWithTrpcRoutes } from '@ditsmod/trpc';

import { PostController } from './post.controller.js';
import { DbModule } from '#modules/db/db.module.js';
import { CommentModule } from './comments/comment.module.js';

@initTrpcModule({
  imports: [DbModule, CommentModule],
  controllers: [PostController],
})
@featureModule()
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
