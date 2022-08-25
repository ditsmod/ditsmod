import { Injectable } from '@ts-stack/di';

@Injectable()
export class FirstPerRouService {
  private counter = 0;

  getCounter() {
    return ++this.counter;
  }
}
