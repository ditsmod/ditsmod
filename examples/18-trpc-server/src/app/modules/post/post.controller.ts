import { trpcController, TrpcRouteService, trpcRoute } from '@ditsmod/trpc';
import { Providers } from '@ditsmod/core';
import { z } from 'zod';

import { PostService } from '#post/post.service.js';
import { Guard, MyHttpInterceptor } from '#post/post.interceptors.js';

@trpcController({
  providersPerReq: new Providers().useFactories(PostService),
})
export class PostController {
  @trpcRoute([Guard], [MyHttpInterceptor])
  listPosts(routeService: TrpcRouteService) {
    return routeService.diQuery(PostService.prototype.listPosts);
  }

  @trpcRoute()
  createPost(routeService: TrpcRouteService<any, { title: string }>) {
    return routeService.diMutation(PostService.prototype.createPost);
  }

  @trpcRoute()
  alternativeCreatePost(routeService: TrpcRouteService) {
    return routeService.diInputAndMutation(z.object({ title: z.string() }), PostService.prototype.createPost);
  }
}
