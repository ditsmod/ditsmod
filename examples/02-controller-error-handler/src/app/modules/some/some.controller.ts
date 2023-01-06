import { controller, RequestContext, route } from '@ditsmod/core';

@controller()
export class SomeController {
  @route('GET')
  ok(ctx: RequestContext) {
    ctx.res.send('ok');
  }

  @route('GET', 'throw-error')
  throwError() {
    throw new Error('Here some error occurred');
  }
}
