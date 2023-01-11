import { controller, Res, route } from '@ditsmod/core';

import { FirstService } from './first.service';

@controller()
export class FirstController {
  constructor(private firstService: FirstService) {}

  @route('GET', 'first')
  tellHefllo(res: Res) {
    res.send(this.firstService.countToThree());
  }
}
