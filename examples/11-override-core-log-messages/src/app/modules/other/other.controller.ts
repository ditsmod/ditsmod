import { controller, RequestContext, Res, route } from '@ditsmod/core';

import { SomeService } from '../some/some.service';

@controller()
export class OtherController {
  constructor(private someService: SomeService) {}

  @route('GET')
  tellHello(ctx: RequestContext) {
    this.someService.setSomeLog();
    ctx.res.send("I'm OtherController\n");
  }
}
