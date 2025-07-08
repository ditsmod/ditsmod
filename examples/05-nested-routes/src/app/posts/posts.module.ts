import { featureModule } from '@ditsmod/core';
import { RestModule, addRest } from '@ditsmod/rest';

import { CommentsModule } from './comments/comments.module.js';
import { PostsController } from './posts.controller.js';

@addRest({ controllers: [PostsController], appends: [{ path: 'comments/:commentId', module: CommentsModule }] })
@featureModule({
  imports: [RestModule],
})
export class PostsModule {}
