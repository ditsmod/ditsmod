import { featureModule } from '@ditsmod/core';
import { RestModule } from '@ditsmod/rest';

import { CommentsModule } from './comments/comments.module.js';
import { PostsController } from './posts.controller.js';

@featureModule({
  imports: [RestModule],
  appends: [{ path: 'comments/:commentId', module: CommentsModule }],
  controllers: [PostsController],
})
export class PostsModule {}
