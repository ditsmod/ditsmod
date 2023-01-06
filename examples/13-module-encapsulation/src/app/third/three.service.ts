import { injectable, Req } from '@ditsmod/core';

import { SecondService } from '../second/second.service';

@injectable()
export class ThirdService {
  constructor(private secondService: SecondService) {}

  getCounter() {
    return this.secondService.getCounter();
  }

  getBody(req: Req) {
    return this.secondService.getBody(req);
  }
}
