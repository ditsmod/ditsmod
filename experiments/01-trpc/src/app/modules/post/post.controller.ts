import { controller, RouteService, trpcRoute } from '@ditsmod/trpc';
import { Providers } from '@ditsmod/core';
import { z } from 'zod';

import { PostService } from '#post/post.service.js';
import { Guard, MyHttpInterceptor } from '#post/post.interceptors.js';

@controller({
  providersPerReq: new Providers().useFactories(PostService),
})
export class PostController {
  @trpcRoute([Guard], [MyHttpInterceptor])
  listPosts(routeService: RouteService) {
    return routeService.query(PostService.prototype.listPosts);
  }

  @trpcRoute()
  createPost(routeService: RouteService<any, { title: string }>) {
    return routeService.mutation(PostService.prototype.createPost);
  }

  @trpcRoute()
  alternativeCreatePost(routeService: RouteService) {
    return routeService.inputAndMutation(z.object({ title: z.string() }), PostService.prototype.createPost);
  }
}
