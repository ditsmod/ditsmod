import { Injectable } from '@ts-stack/di';

@Injectable()
export class OneService {
  private counter = 0;

  getCounter() {
    return ++this.counter;
  }
}
