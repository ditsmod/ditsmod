import { injectable } from '@ditsmod/core';
import { HttpBody } from '@ditsmod/body-parser';

import { FirstService } from '../first/first.service';

@injectable()
export class SecondService {
  constructor(private oneService: FirstService) {}

  getCounter() {
    return this.oneService.getCounter();
  }

  getBody(body: HttpBody) {
    return this.oneService.getBody(body);
  }
}
