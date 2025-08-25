import { featureModule } from '@ditsmod/core';

import { PostService } from './post.service.js';
import { DbModule } from '#app/modules/db/db.module.js';

@featureModule({
  imports: [DbModule],
  providersPerMod: [PostService],
  exports: [PostService],
})
export class PostModule {}
