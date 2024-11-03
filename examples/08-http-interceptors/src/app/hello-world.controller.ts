import { controller, RequestContext, Res, route } from '@ditsmod/core';

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

@controller({ singleton: 'module' })
export class HelloWorldController2 {
  @route('GET', 'singleton')
  tellHello(ctx: RequestContext) {
    return 'Original message!';
  }
}
