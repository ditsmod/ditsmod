import { LoggerConfig, ProviderBuilder } from '@holu/core';
import { restRootModule } from '@holu/rest';

import { PostsModule } from './posts/posts.module.js';

@restRootModule({
  appends: [{ path: 'posts/:postId', module: PostsModule }],
  providersPerApp: new ProviderBuilder().useValue(LoggerConfig, { level: 'info' }),
})
export class AppModule {}
