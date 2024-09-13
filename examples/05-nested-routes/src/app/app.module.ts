import { Providers, rootModule } from '@ditsmod/core';

import { PostsModule } from './posts/posts.module.js';

@rootModule({
  appends: [{ path: 'posts/:postId', module: PostsModule }],
  providersPerApp: new Providers().useLogConfig({ level: 'info' }),
})
export class AppModule {}
