import { featureModule } from '@ditsmod/core';
import { initRest } from '@ditsmod/rest';

import { CommentsController } from './comments.controller.js';

@initRest({ controllers: [CommentsController] })
@featureModule()
export class CommentsModule {}
