import { featureModule } from '@ditsmod/core';
import { RoutingModule } from '@ditsmod/routing';

import { CommentsController } from './comments.controller.js';

@featureModule({
  imports: [RoutingModule],
  controllers: [CommentsController],
})
export class CommentsModule {}
