import { controller, RequestContext, route } from '@ditsmod/core';

import { FirstService } from './first.service';

@controller()
export class FirstController {
  constructor(private firstService: FirstService) {}

  @route('GET', 'first')
  tellHefllo(ctx: RequestContext) {
    ctx.res.send(this.firstService.countToThree());
  }
}
