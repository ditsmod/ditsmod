import { injectable } from '@ts-stack/di';
import { Req } from '@ditsmod/core';

@injectable()
export class FirstService {
  private counter = 0;

  constructor(private req: Req) {}

  getCounter() {
    return ++this.counter;
  }

  getBody() {
    return this.req.body;
  }
}
