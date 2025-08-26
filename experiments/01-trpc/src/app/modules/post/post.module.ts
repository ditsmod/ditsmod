import { featureModule } from '@ditsmod/core';
import { initTrpc } from '@ditsmod/trpc';

import { PostController } from './post.controller.js';
import { DbModule } from '#app/modules/db/db.module.js';

@initTrpc({
  imports: [DbModule],
  controllers: [PostController],
})
@featureModule()
export class PostModule {}
