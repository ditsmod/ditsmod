import { restModule } from '@ditsmod/rest';

import { CommentsModule } from './comments/comments.module.js';
import { PostsController } from './posts.controller.js';

@restModule({
  appends: [{ path: 'comments/:commentId', module: CommentsModule }],
  controllers: [PostsController]
})
export class PostsModule {}
