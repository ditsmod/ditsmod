import { Module } from '@ts-stack/ditsmod';

import { CommentsController } from './comments.controller';

@Module({
  controllers: [CommentsController],
})
export class CommentsModule {}
