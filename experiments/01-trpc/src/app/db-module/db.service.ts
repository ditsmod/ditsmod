import { injectable } from '@ditsmod/core';
import type { MessageService } from '#app/message-module/message.service.js';

@injectable()
export class DbService {
  id = 0;
  posts = [
    {
      id: ++this.id,
      title: 'hello',
    },
  ];
  messages: ReturnType<typeof MessageService.prototype.createMessage>[] = [] as any;
}
