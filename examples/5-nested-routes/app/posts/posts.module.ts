import { Module } from '@ts-stack/ditsmod';

import { CommentsModule } from '../comments/comments.module';
import { PostsController } from './posts.controller';

@Module({
  imports: [{ prefix: 'comments/:commentId', module: CommentsModule }],
  controllers: [PostsController],
})
export class PostsModule {}
