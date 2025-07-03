import { featureModule } from '@ditsmod/core';
import { RestModule } from '@ditsmod/rest';

import { CommentsController } from './comments.controller.js';

@featureModule({
  imports: [RestModule],
  controllers: [CommentsController],
})
export class CommentsModule {}
