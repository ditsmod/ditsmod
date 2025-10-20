import { Providers } from '@ditsmod/core';
import { restRootModule } from '@ditsmod/rest';

import { PostsModule } from './posts/posts.module.js';

@restRootModule({
  appends: [{ path: 'posts/:postId', module: PostsModule }],
  providersPerApp: new Providers().useLogConfig({ level: 'info' }),
})
export class AppModule {}
