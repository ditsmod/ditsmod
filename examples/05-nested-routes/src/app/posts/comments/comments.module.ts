import { featureModule } from '@ditsmod/core';
import { RestModule, initRest } from '@ditsmod/rest';

import { CommentsController } from './comments.controller.js';

@initRest({ controllers: [CommentsController] })
@featureModule({
  imports: [RestModule],
})
export class CommentsModule {}
