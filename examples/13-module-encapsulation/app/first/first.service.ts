import { Injectable } from '@ts-stack/di';
import { Request } from '@ditsmod/core';

@Injectable()
export class FirstService {
  private counter = 0;

  constructor(private req: Request) {}

  getCounter() {
    return ++this.counter;
  }

  getBody() {
    return this.req.body;
  }
}
