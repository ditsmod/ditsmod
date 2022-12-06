import { Module } from '@ditsmod/core';

import { CommentsModule } from './comments/comments.module';
import { PostsController } from './posts.controller';

@Module({
  appends: [{ path: 'comments/:commentId', module: CommentsModule }],
  controllers: [PostsController],
})
export class PostsModule {}
