import { injectable } from '@ditsmod/core';

import { FirstService } from '../first/first.service.js';

@injectable()
export class SecondService {
  constructor(private oneService: FirstService) {}

  getCounter() {
    return this.oneService.getCounter();
  }

  getBody(body: any) {
    return this.oneService.getBody(body);
  }
}
