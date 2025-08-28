import { featureModule, Injector } from '@ditsmod/core';
import { initTrpcModule, ModuleWithTrpcRoutes, TrpcService } from '@ditsmod/trpc';

import { PostController } from './post.controller.js';
import { DbModule } from '#modules/db/db.module.js';
import { CommentModule } from './comments/comment.module.js';

@initTrpcModule({
  imports: [DbModule, CommentModule],
  controllers: [PostController],
})
@featureModule()
export class PostModule implements ModuleWithTrpcRoutes {
  constructor(
    private inj: Injector,
    private trpcService: TrpcService,
  ) {}

  getRouterConfig() {
    return {
      post: {
        createPost: this.inj.get(PostController.prototype.createPost),
        listPosts: this.inj.get(PostController.prototype.listPosts),
        comments: this.trpcService.getRouterConfig(CommentModule),
      },
    };
  }
}
