import { featureModule } from '@ditsmod/core';

import { PostService } from './post.service.js';
import { DbModule } from '#app/db-module/db.module.js';

@featureModule({
  imports: [DbModule],
  providersPerMod: [PostService],
  exports: [PostService],
})
export class PostModule {}
