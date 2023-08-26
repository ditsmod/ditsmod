import { featureModule } from '@ditsmod/core';

import { CommentsController } from './comments.controller.js';

@featureModule({
  controllers: [CommentsController],
})
export class CommentsModule {}
