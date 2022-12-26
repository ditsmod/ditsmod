import { injectable } from '@ditsmod/core';

@injectable()
export class FirstPerRouService {
  private counter = 0;

  getCounter() {
    return ++this.counter;
  }
}
