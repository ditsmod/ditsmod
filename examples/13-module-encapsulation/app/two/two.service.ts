import { Injectable } from '@ts-stack/di';

import { OneService } from '../one/one.service';

@Injectable()
export class TwoService {
  constructor(private oneService: OneService) {}

  getCounter() {
    return this.oneService.getCounter();
  }

  getBody() {
    return this.oneService.getBody();
  }
}
