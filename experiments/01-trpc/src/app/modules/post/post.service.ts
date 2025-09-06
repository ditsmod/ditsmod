import { injectable, factoryMethod } from '@ditsmod/core';
import { opts, TrpcOpts } from '@ditsmod/trpc';

import { DbService } from '../db/db.service.js';


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
    return db.posts;
  }
}

export interface InputPost {
  title: string;
}

