import { Module } from '@ditsmod/core';

import { CommentsController } from './comments.controller';

@Module({
  controllers: [CommentsController],
})
export class CommentsModule {}
