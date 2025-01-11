import { Res } from '@ditsmod/core';
import { controller, route } from '@ditsmod/routing';

import { FirstService } from './first.service.js';

@controller()
export class FirstController {
  constructor(private firstService: FirstService) {}

  @route('GET', 'first')
  tellHefllo(res: Res) {
    res.send(this.firstService.countToThree());
  }
}
