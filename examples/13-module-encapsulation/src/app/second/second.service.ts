import { injectable, Req } from '@ditsmod/core';

import { FirstService } from '../first/first.service';

@injectable()
export class SecondService {
  constructor(private oneService: FirstService) {}

  getCounter() {
    return this.oneService.getCounter();
  }

  getBody(req: Req) {
    return this.oneService.getBody(req);
  }
}
