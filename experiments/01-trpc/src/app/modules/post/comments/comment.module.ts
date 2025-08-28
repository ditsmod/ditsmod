import { featureModule, Injector } from '@ditsmod/core';
import { initTrpcModule, ModuleWithTrpcRoutes } from '@ditsmod/trpc';

import { CommentController } from './comment.controller.js';
import { DbModule } from '#app/modules/db/db.module.js';

@initTrpcModule({
  imports: [DbModule],
  controllers: [CommentController],
})
@featureModule()
export class CommentModule implements ModuleWithTrpcRoutes {
  constructor(private inj: Injector) {}

  getRouterConfig() {
    return {
      createComment: this.inj.get(CommentController.prototype.createComment),
      listComments: this.inj.get(CommentController.prototype.listComments),
    };
  }
}
