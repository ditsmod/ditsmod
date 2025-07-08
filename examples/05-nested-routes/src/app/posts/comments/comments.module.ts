import { featureModule } from '@ditsmod/core';
import { RestModule, addRest } from '@ditsmod/rest';

import { CommentsController } from './comments.controller.js';

@addRest({ controllers: [CommentsController] })
@featureModule({
  imports: [RestModule],
})
export class CommentsModule {}
