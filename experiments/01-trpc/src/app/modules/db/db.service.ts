import { injectable } from '@ditsmod/core';
import { MessageController } from '../message/message.controller.js';

@injectable()
export class DbService {
  id = 0;
  posts = [
    {
      id: ++this.id,
      title: 'hello',
    },
  ];
  messages: ReturnType<typeof MessageController.prototype.createMessage>[] = [];
}
