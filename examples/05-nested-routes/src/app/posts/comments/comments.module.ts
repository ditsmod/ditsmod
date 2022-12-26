import { featureModule } from '@ditsmod/core';

import { CommentsController } from './comments.controller';

@featureModule({
  controllers: [CommentsController],
})
export class CommentsModule {}
