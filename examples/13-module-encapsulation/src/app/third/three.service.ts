import { injectable } from '@ditsmod/core';
import { HttpBody } from '@ditsmod/body-parser';

import { SecondService } from '../second/second.service';

@injectable()
export class ThirdService {
  constructor(private secondService: SecondService) {}

  getCounter() {
    return this.secondService.getCounter();
  }

  getBody(body: HttpBody) {
    return this.secondService.getBody(body);
  }
}
