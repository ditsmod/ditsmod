import { featureModule } from '@ditsmod/core';

import { Db } from './db.js';
import { PostService } from './post.service.js';

@featureModule({
  providersPerApp: [Db, PostService],
})
export class PostModule {}
