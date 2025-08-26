import { featureModule } from '@ditsmod/core';
import { initTrpcModule } from '@ditsmod/trpc';

import { PostController } from './post.controller.js';
import { DbModule } from '#app/modules/db/db.module.js';

@initTrpcModule({
  imports: [DbModule],
  controllers: [PostController],
})
@featureModule()
export class PostModule {}
