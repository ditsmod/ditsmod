import { Injectable } from '@ts-stack/di';

import { TwoService } from '../two/two.service';

@Injectable()
export class ThreeService {
  constructor(private twoService: TwoService) {}

  getHello(): string {
    return this.twoService.getHello();
  }
}
