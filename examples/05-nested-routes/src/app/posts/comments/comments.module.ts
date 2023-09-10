import { featureModule } from '@ditsmod/core';
import { RouterModule } from '@ditsmod/router';

import { CommentsController } from './comments.controller.js';

@featureModule({
  imports: [RouterModule],
  controllers: [CommentsController],
})
export class CommentsModule {}
