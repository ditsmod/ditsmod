import { controller, RouteService, TRPC_OPTS, trpcRoute } from '@ditsmod/trpc';
import { injectable, factoryMethod, inject, Providers } from '@ditsmod/core';
import { z } from 'zod';

import { DbService } from '#modules/db/db.service.js';

@injectable()
export class PostService {
  @factoryMethod()
  createPost(@inject(TRPC_OPTS) opts: any, db: DbService) {
    const post = {
      id: ++db.id,
      ...opts.input,
    } as (typeof db.posts)[0];
    db.posts.push(post);
    return post;
  }

  @factoryMethod()
  listPosts(db: DbService) {
    return db.posts;
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

  @trpcRoute()
  listPosts(routeService: RouteService) {
    return routeService.query(PostService.prototype.listPosts);
  }
}

export interface InputPost {
  title: string;
}
