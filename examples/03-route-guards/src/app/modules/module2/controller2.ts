import { controller, RequestContext, route } from '@ditsmod/core';

@controller({ isSingleton: true })
export class Controller2 {
  @route('GET', 'hello2')
  ok(ctx: RequestContext) {
    ctx.send('ok');
  }
}
