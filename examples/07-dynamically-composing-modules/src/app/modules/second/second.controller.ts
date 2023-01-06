import { controller, RequestContext, route } from '@ditsmod/core';

@controller()
export class SecondController {
  @route('GET', 'get-2')
  async tellHello(ctx: RequestContext) {
    ctx.res.send('second module.\n');
  }
}
