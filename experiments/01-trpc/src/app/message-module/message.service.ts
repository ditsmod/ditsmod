import { TRPC_ROOT } from '@ditsmod/trpc';
import { inject, injectable } from '@ditsmod/core';
import z from 'zod';

import { DbService } from '#app/db-module/db.service.js';
import { TrcpRootObj } from '#app/types.js';

@injectable()
export class MessageService {
  constructor(
    protected db: DbService,
    @inject(TRPC_ROOT) protected t: TrcpRootObj,
  ) {}

  createMessage(text: string) {
    const msg = {
      id: ++this.db.id,
      text,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    return msg;
  }

  setInitialMessage() {
    this.db.messages.push(this.createMessage('initial message'));
  }

  getMessageRouter() {
    return this.t.router({
      addMessage: this.t.procedure.input(z.string()).mutation(({ input }) => {
        const msg = this.createMessage(input);
        this.db.messages.push(msg);

        return msg;
      }),
      listMessages: this.t.procedure.query(() => this.db.messages),
    });
  }

  getHelloRouter() {
    return this.t.procedure.input(z.string().nullish()).query(({ input, ctx }) => {
      return `hello ${input ?? ctx.user?.name ?? 'world'}`;
    });
  }
}
