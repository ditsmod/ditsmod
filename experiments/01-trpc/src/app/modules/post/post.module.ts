import { featureModule, Injector } from '@ditsmod/core';
import { initTrpcModule, TrpcModuleWithRouterConfig } from '@ditsmod/trpc';

import { PostController } from './post.controller.js';
import { DbModule } from '#app/modules/db/db.module.js';

@initTrpcModule({
  imports: [DbModule],
  controllers: [PostController],
})
@featureModule()
export class PostModule implements TrpcModuleWithRouterConfig {
  constructor(private inj: Injector) {}

  getRouterConfig() {
    return {
      post: {
        createPost: this.inj.get(PostController.prototype.createPost),
        listPosts: this.inj.get(PostController.prototype.listPosts),
      },
    };
  }
}
