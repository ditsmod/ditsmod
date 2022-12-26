import { controller, Res, route } from '@ditsmod/core';

import { FirstService } from './first.service';

@controller()
export class FirstController {
  constructor(private res: Res, private firstService: FirstService) {}

  @route('GET', 'first')
  tellHefllo() {
    this.res.send(this.firstService.countToThree());
  }
}
