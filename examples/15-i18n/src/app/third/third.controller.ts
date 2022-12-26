import { controller, Res, route } from '@ditsmod/core';

import { FirstService } from '../first/first.service';

@controller()
export class ThirdController {
  constructor(private res: Res, private firstService: FirstService) {}

  @route('GET', 'third')
  tellHefllo() {
    this.res.send(this.firstService.countToThree());
  }
}
