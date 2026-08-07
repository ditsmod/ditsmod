import { injectable } from '@holu/core';

@injectable()
export class FirstPerRouService {
  private counter = 0;

  getCounter() {
    return ++this.counter;
  }
}
