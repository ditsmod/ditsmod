import { controller, RequestContext, Res } from '@ditsmod/core';
import { route } from '@ditsmod/routing';
import { OtherGuard } from '../../guards.js';

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

@controller()
export class Controller3 {
  @route('GET', 'ok3', [OtherGuard])
  ok(res: Res) {
    res.send('ok3');
  }
}

