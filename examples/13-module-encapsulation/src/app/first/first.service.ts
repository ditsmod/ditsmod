import { Injectable } from '@ts-stack/di';
import { Req } from '@ditsmod/core';

@Injectable()
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
