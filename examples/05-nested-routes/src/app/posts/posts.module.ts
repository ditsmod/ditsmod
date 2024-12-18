import { featureModule } from '@ditsmod/core';
import { RoutingModule } from '@ditsmod/routing';

import { CommentsModule } from './comments/comments.module.js';
import { PostsController } from './posts.controller.js';

@featureModule({
  imports: [RoutingModule],
  appends: [{ path: 'comments/:commentId', module: CommentsModule }],
  controllers: [PostsController],
})
export class PostsModule {}
