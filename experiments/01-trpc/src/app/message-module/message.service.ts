import { inject, injectable } from '@ditsmod/core';
import z from 'zod';

import { TRPC_ROUTER, TrcpRouterFn, TRPC_PROCEDURE, TrcpProcedureFn } from '#app/root-rpc-object.js';
import { DbService } from '#app/db-module/db.service.js';

@injectable()
export class MessageService {
  constructor(
    protected db: DbService,
    @inject(TRPC_ROUTER) protected router: TrcpRouterFn,
    @inject(TRPC_PROCEDURE) protected procedure: TrcpProcedureFn,
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
    return this.router({
      addMessage: this.procedure.input(z.string()).mutation(({ input }) => {
        const msg = this.createMessage(input);
        this.db.messages.push(msg);
    
        return msg;
      }),
      listMessages: this.procedure.query(() => this.db.messages),
    });
  }
}
