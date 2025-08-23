import { injectable } from '@ditsmod/core';

@injectable()
export class Db {
  id = 0;
  posts = [
    {
      id: ++this.id,
      title: 'hello',
    },
  ];
  messages = [this.createMessage('initial message')];

  createMessage(text: string) {
    const msg = {
      id: ++this.id,
      text,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    return msg;
  }
}
