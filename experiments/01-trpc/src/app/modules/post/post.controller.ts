import {
  CanActivate,
  controller,
  HttpHandler,
  HttpInterceptor,
  opts,
  RequestContext,
  RouteService,
  TrpcOpts,
  trpcRoute,
} from '@ditsmod/trpc';
import { injectable, factoryMethod, Providers, Logger } from '@ditsmod/core';
import { z } from 'zod';

import { DbService } from '#modules/db/db.service.js';

@injectable()
export class PostService {
  @factoryMethod()
  createPost(@opts opts: TrpcOpts<InputPost>, db: DbService) {
    const post = {
      id: ++db.id,
      ...opts.input,
    } as (typeof db.posts)[0];
    db.posts.push(post);
    return post;
  }

  @factoryMethod()
  listPosts(db: DbService) {
    console.log('-'.repeat(10), 'PostService works');
    return db.posts;
  }
}

export class Guard implements CanActivate {
  canActivate(ctx: RequestContext) {
    console.log('called Guard');
    return true;
  }
}

@injectable()
export class MyHttpInterceptor implements HttpInterceptor {
  constructor(private logger: Logger) {}

  async intercept(next: HttpHandler, ctx: RequestContext) {
    console.log('>'.repeat(10), 'MyHttpInterceptor works!');
    const originalMsg = await next.handle(); // Handling request to `HelloWorldController`
    return originalMsg;
  }
}

@controller({
  providersPerReq: new Providers().useFactories(PostService),
})
export class PostController {
  @trpcRoute()
  createPost2(routeService: RouteService) {
    const { procedure, mutation } = routeService.getMutation(PostService.prototype.createPost);
    return procedure.input(z.object({ title: z.string() })).mutation(mutation);
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

export interface InputPost {
  title: string;
}
