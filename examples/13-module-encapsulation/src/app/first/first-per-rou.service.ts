import { injectable } from '@ts-stack/di';

@injectable()
export class FirstPerRouService {
  private counter = 0;

  getCounter() {
    return ++this.counter;
  }
}
