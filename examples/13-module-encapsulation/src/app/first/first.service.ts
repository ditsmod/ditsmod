import { HttpBody } from '@ditsmod/body-parser';
import { injectable } from '@ditsmod/core';

@injectable()
export class FirstService {
  private counter = 0;

  getCounter() {
    return ++this.counter;
  }

  getBody(body: HttpBody) {
    return body;
  }
}
