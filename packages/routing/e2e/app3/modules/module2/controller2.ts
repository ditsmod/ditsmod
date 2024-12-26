import { controller, RequestContext } from '@ditsmod/core';
import { route } from '@ditsmod/routing';

@controller({ scope: 'module' })
export class Controller2 {
  @route('GET', 'controler2-of-module2')
  ok(ctx: RequestContext) {
    ctx.send('ok');
  }
}
