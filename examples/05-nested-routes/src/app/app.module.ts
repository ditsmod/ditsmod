import { Providers, rootModule } from '@ditsmod/core';
import { initRest } from '@ditsmod/rest';

import { PostsModule } from './posts/posts.module.js';

@initRest({
  appends: [{ path: 'posts/:postId', module: PostsModule }],
  providersPerApp: new Providers().useLogConfig({ level: 'info' }),
})
@rootModule()
export class AppModule {}
