import { RootModule, Router } from '@ditsmod/core';
import { DefaultRouter } from '@ts-stack/router';

import { PostsModule } from './posts/posts.module';

@RootModule({
  prefixPerApp: 'api',
  imports: [{ prefix: 'posts/:postId', module: PostsModule }],
  providersPerApp: [{ provide: Router, useClass: DefaultRouter }],
})
export class AppModule {}
