import { rootModule } from '@ditsmod/core';

import { PostsModule } from './posts/posts.module.js';

@rootModule({
  appends: [{ path: 'posts/:postId', module: PostsModule }],
})
export class AppModule {}
