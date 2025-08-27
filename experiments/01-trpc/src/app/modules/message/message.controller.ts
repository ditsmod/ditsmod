import { controller, proc, trpcRoute } from '@ditsmod/trpc';
import z from 'zod';

import { DbService } from '#modules/db/db.service.js';
import { TrpcProc } from '#app/types.js';

@controller()
export class MessageController {
  constructor(protected db: DbService) {}

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
  addMessage(@proc() proc: TrpcProc) {
    return proc.input(z.string()).mutation(({ input }) => {
      const msg = this.createMessage(input);
      this.db.messages.push(msg);
      return msg;
    });
  }

  @trpcRoute()
  listMessages(@proc() proc: TrpcProc) {
    return proc.query(() => this.db.messages);
  }

  @trpcRoute()
  getHelloRouter(@proc() proc: TrpcProc) {
    return proc.input(z.string().nullish()).query(({ input, ctx }) => {
      return `hello ${input ?? ctx.user?.name ?? 'world'}`;
    });
  }
}
