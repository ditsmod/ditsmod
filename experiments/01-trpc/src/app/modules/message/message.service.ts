import { injectable } from '@ditsmod/core';

import { DbService } from '#db/db.service.js';

@injectable()
export class MessageService {
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
}
