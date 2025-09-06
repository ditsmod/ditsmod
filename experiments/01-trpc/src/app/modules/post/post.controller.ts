import { controller, RouteService, trpcRoute } from '@ditsmod/trpc';
import { Providers } from '@ditsmod/core';
import { z } from 'zod';

import { PostService } from './post.service.js';
import { Guard, MyHttpInterceptor } from './post.interceptors.js';

@controller({
  providersPerReq: new Providers().useFactories(PostService),
})
export class PostController {
  @trpcRoute()
  createPost2(routeService: RouteService) {
    return routeService.inputAndMutation(z.object({ title: z.string() }), PostService.prototype.createPost);
  }

  @trpcRoute()
  createPost(routeService: RouteService<any, { title: string }>) {
    return routeService.mutation(PostService.prototype.createPost);
  }

  @trpcRoute([Guard], [MyHttpInterceptor])
  listPosts(routeService: RouteService) {
    return routeService.query(PostService.prototype.listPosts);
  }
}
