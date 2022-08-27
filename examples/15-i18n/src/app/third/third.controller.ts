import { Controller, Res, Route } from '@ditsmod/core';

import { FirstService } from '../first/first.service';

@Controller()
export class ThirdController {
  constructor(private res: Res, private firstService: FirstService) {}

  @Route('GET', 'third')
  tellHefllo() {
    this.res.send(this.firstService.countToThree());
  }
}
