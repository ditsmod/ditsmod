import { controller, RequestContext, Res, route } from '@ditsmod/core';

@controller()
export class OtherController {
  @route('GET', 'hello')
  ok(res: Res) {
    res.send('ok');
  }
}

@controller({ isSingleton: true })
export class SingletonController {
  @route('GET', 'hello2')
  ok(ctx: RequestContext) {
    ctx.send('ok');
  }
}
