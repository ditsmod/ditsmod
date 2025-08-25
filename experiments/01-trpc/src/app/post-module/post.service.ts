import { TRPC_ROOT } from '@ditsmod/trpc';
import { inject, injectable } from '@ditsmod/core';
import { z } from 'zod';

import { DbService } from '../db-module/db.service.js';
import { MessageService } from '#app/message-module/message.service.js';
import { TrcpRootObj } from '#app/types.js';

@injectable()
export class PostService {
  constructor(
    messageService: MessageService,
    protected db: DbService,
    @inject(TRPC_ROOT) protected t: TrcpRootObj,
  ) {
    messageService.setInitialMessage();
  }

  getPostRouter() {
    return this.t.router({
      createPost: this.t.procedure.input(z.object({ title: z.string() })).mutation(({ input }) => {
        const post = {
          id: ++this.db.id,
          ...input,
        };
        this.db.posts.push(post);
        return post;
      }),
      listPosts: this.t.procedure.query(() => this.db.posts),
    });
  }
}
