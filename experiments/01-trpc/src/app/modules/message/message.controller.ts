import { controller, RouteService, trpcRoute } from '@ditsmod/trpc';
import z from 'zod';

import { DbService } from '#modules/db/db.service.js';
import { MessageService } from './message.service.js';
import { TrpcContext } from '#app/types.js';

@controller()
export class MessageController {
  constructor(
    protected db: DbService,
    protected messageService: MessageService,
  ) {}

  @trpcRoute()
  addMessage(routeService: RouteService) {
    return routeService.procedure.input(z.string()).mutation(({ input }) => {
      const msg = this.messageService.createMessage(input);
      this.db.messages.push(msg);
      return msg;
    });
  }

  @trpcRoute()
  listMessages(routeService: RouteService) {
    return routeService.procedure.query(() => this.db.messages);
  }

  @trpcRoute()
  getHelloRouter(routeService: RouteService<TrpcContext>) {
    return routeService.procedure.input(z.string().nullish()).query(({ input, ctx }) => {
      return `hello ${input ?? ctx.user?.name ?? 'world'}`;
    });
  }
}
