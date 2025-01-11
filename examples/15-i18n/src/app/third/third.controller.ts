import { Res } from '@ditsmod/core';
import { controller, route } from '@ditsmod/routing';

import { FirstService } from '../first/first.service.js';

@controller()
export class ThirdController {
  constructor(private firstService: FirstService) {}

  @route('GET', 'third')
  tellHefllo(res: Res) {
    res.send(this.firstService.countToThree());
  }
}
