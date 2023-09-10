import { featureModule } from '@ditsmod/core';

import { CommentsModule } from './comments/comments.module.js';
import { PostsController } from './posts.controller.js';
import { RouterModule } from '@ditsmod/router';

@featureModule({
  imports: [RouterModule],
  appends: [{ path: 'comments/:commentId', module: CommentsModule }],
  controllers: [PostsController],
})
export class PostsModule {}
