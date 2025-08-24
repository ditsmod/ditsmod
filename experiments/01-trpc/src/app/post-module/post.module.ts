import { featureModule } from '@ditsmod/core';

import { Db } from './db.js';
import { PostService } from './post.service.js';

@featureModule({
  providersPerMod: [Db, PostService],
  exports: [Db, PostService],
})
export class PostModule {}
