import { injectable } from '@ts-stack/di';

import { SecondService } from '../second/second.service';

@injectable()
export class ThirdService {
  constructor(private secondService: SecondService) {}

  getCounter() {
    return this.secondService.getCounter();
  }

  getBody() {
    return this.secondService.getBody();
  }
}
