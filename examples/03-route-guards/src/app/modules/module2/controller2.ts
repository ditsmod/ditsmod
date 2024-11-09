import { controller, RequestContext, route } from '@ditsmod/core';

@controller({ scope: 'module' })
export class Controller2 {
  @route('GET', 'controler2-of-module2')
  ok(ctx: RequestContext) {
    ctx.send('ok');
  }
}
