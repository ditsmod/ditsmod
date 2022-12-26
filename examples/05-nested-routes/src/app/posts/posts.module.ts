import { featureModule } from '@ditsmod/core';

import { CommentsModule } from './comments/comments.module';
import { PostsController } from './posts.controller';

@featureModule({
  appends: [{ path: 'comments/:commentId', module: CommentsModule }],
  controllers: [PostsController],
})
export class PostsModule {}
