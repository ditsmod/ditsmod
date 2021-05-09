import { RootModule } from '@ditsmod/core';
import { RouterModule } from '@ditsmod/router';

import { PostsModule } from './posts/posts.module';

@RootModule({
  prefixPerApp: 'api',
  imports: [RouterModule, { prefix: 'posts/:postId', module: PostsModule }],
})
export class AppModule {}
