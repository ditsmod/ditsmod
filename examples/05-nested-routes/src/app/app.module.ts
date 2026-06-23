import { LoggerConfig, Providers } from '@ditsmod/core';
import { restRootModule } from '@ditsmod/rest';

import { PostsModule } from './posts/posts.module.js';

@restRootModule({
  appends: [{ path: 'posts/:postId', module: PostsModule }],
  providersPerApp: new Providers().useValue(LoggerConfig, { level: 'info' }),
})
export class AppModule {}
