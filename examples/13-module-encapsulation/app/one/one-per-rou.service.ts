import { Injectable } from '@ts-stack/di';

@Injectable()
export class OnePerRouService {
  private counter = 0;

  getCounter() {
    return ++this.counter;
  }
}
