import { Injectable } from '@ts-stack/di';

import { TwoService } from '../two/two.service';

@Injectable()
export class ThreeService {
  constructor(private twoService: TwoService) {}

  getCounter() {
    return this.twoService.getCounter();
  }

  getBody() {
    return this.twoService.getBody();
  }
}
