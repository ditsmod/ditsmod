import { RequestContext, Res } from '@ditsmod/core';
import { controller, route } from '@ditsmod/routing';

@controller()
export class HelloWorldController {
  @route('GET')
  tellHello(res: Res) {
    return 'Original message!';
  }

  @route('GET', 'throw-error')
  throwError() {
    throw new Error('some error here!');
  }
}

@controller({ scope: 'ctx' })
export class HelloWorldController2 {
  @route('GET', 'context-scoped')
  tellHello(ctx: RequestContext) {
    return 'Original message!';
  }
}
