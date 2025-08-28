import { controller, proc, trpcRoute } from '@ditsmod/trpc';
import z from 'zod';

import { DbService } from '#modules/db/db.service.js';
import { TrpcProc } from '#app/types.js';
import { MessageService } from './message.service.js';

@controller()
export class MessageController {
  constructor(
    protected db: DbService,
    protected messageService: MessageService,
  ) {}

  @trpcRoute()
  addMessage(@proc() proc: TrpcProc) {
    return proc.input(z.string()).mutation(({ input }) => {
      const msg = this.messageService.createMessage(input);
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
