import { controller, RequestContext, route } from '@ditsmod/core';

import { FirstService } from '../first/first.service';

@controller()
export class ThirdController {
  constructor(private firstService: FirstService) {}

  @route('GET', 'third')
  tellHefllo(ctx: RequestContext) {
    ctx.res.send(this.firstService.countToThree());
  }
}
