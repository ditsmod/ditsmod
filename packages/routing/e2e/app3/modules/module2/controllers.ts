import { controller, RequestContext, Res } from '@ditsmod/core';
import { route } from '@ditsmod/routing';

@controller()
export class Controller1 {
  @route('GET', 'ok1')
  ok(res: Res) {
    res.send('ok1');
  }
}

@controller({ scope: 'module' })
export class Controller2 {
  @route('GET', 'ok2')
  ok(ctx: RequestContext) {
    ctx.send('ok2');
  }
}

