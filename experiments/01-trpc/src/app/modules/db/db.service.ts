import { injectable } from '@ditsmod/core';
import { MessageService } from '../message/message.service.js';

@injectable()
export class DbService {
  id = 0;
  commentId = 0;
  posts = [
    {
      id: ++this.id,
      title: 'hello',
    },
  ];
  comments = [
    {
      id: ++this.commentId,
      title: 'comment of post',
    },
  ];
  messages: ReturnType<typeof MessageService.prototype.createMessage>[] = [];
}
