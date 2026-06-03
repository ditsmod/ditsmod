import { RequestContext, controller, route } from '@ditsmod/rest';

import { FirstService } from '../first/first.service.js';

@controller()
export class ThirdController {
  constructor(private firstService: FirstService) {}

  @route('GET', 'third')
  tellHefllo(ctx: RequestContext) {
    ctx.send(this.firstService.countToThree());
  }
}
