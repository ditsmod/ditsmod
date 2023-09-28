import { featureModule } from '@ditsmod/core';

import { CommentsModule } from './comments/comments.module.js';
import { PostsController } from './posts.controller.js';
import { RoutingModule } from '@ditsmod/routing';

@featureModule({
  imports: [RoutingModule],
  appends: [{ path: 'comments/:commentId', module: CommentsModule }],
  controllers: [PostsController],
})
export class PostsModule {}
