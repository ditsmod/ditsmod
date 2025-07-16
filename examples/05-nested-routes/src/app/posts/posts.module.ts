import { featureModule } from '@ditsmod/core';
import { RestModule, initRest } from '@ditsmod/rest';

import { CommentsModule } from './comments/comments.module.js';
import { PostsController } from './posts.controller.js';

@initRest({
  appends: [{ path: 'comments/:commentId', module: CommentsModule }],
  controllers: [PostsController]
})
@featureModule({
  imports: [RestModule],
})
export class PostsModule {}
