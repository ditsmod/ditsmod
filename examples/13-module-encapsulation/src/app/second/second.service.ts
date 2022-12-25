import { injectable } from '@ts-stack/di';

import { FirstService } from '../first/first.service';

@injectable()
export class SecondService {
  constructor(private oneService: FirstService) {}

  getCounter() {
    return this.oneService.getCounter();
  }

  getBody() {
    return this.oneService.getBody();
  }
}
