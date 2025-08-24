import { featureModule } from '@ditsmod/core';

import { PostService } from './post.service.js';
import { MessageModule } from '#app/message-module/message.module.js';
import { DbModule } from '#app/db-module/db.module.js';

@featureModule({
  imports: [MessageModule, DbModule],
  providersPerMod: [PostService],
  exports: [PostService],
})
export class PostModule {}
