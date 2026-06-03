import { RequestContext, controller, route } from '@ditsmod/rest';

import { SomeService } from '../some/some.service.js';

@controller()
export class OtherController {
  constructor(private someService: SomeService) {}

  @route('GET')
  tellHello(ctx: RequestContext) {
    this.someService.setSomeLog();
    ctx.send("I'm OtherController\n");
  }
}
