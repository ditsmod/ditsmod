import { controller, proc, TRPC_ROOT, trpcRoute } from '@ditsmod/trpc';
import { inject } from '@ditsmod/core';
import z from 'zod';

import { DbService } from '#modules/db/db.service.js';
import { TrpcProc, TrpcRootObj } from '#app/types.js';

@controller()
export class MessageController {
  constructor(
    protected db: DbService,
    @inject(TRPC_ROOT) protected t: TrpcRootObj,
  ) {
    db.messages.push(this.createMessage('initial message'));
  }

  createMessage(text: string) {
    const msg = {
      id: ++this.db.id,
      text,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    return msg;
  }

  @trpcRoute()
  getMessageRouter(@proc() proc1: TrpcProc, @proc() proc2: TrpcProc) {
    return this.t.router({
      addMessage: proc1.input(z.string()).mutation(({ input }) => {
        const msg = this.createMessage(input);
        this.db.messages.push(msg);
        return msg;
      }),
      listMessages: proc2.query(() => this.db.messages),
    });
  }

  @trpcRoute()
  getHelloRouter(@proc() proc: TrpcProc) {
    return proc.input(z.string().nullish()).query(({ input, ctx }) => {
      return `hello ${input ?? ctx.user?.name ?? 'world'}`;
    });
  }
}
