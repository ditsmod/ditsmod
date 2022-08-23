import { Controller, Res, Route } from '@ditsmod/core';

import { FirstService } from './first.service';

@Controller()
export class FirstController {
  constructor(private res: Res, private firstService: FirstService) {}

  @Route('GET', 'first')
  tellHefllo() {
    this.res.send(this.firstService.countToThree());
  }
}
