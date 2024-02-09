import { controller, RequestContext, Res, route } from '@ditsmod/core';

@controller()
export class HelloWorldController {
  @route('GET')
  tellHello(res: Res) {
    res.send('Hello World!\n');
  }

  @route('GET', 'throw-error')
  throwError() {
    throw new Error('some error here!');
  }
}

@controller({ isSingleton: true })
export class HelloWorldController2 {
  @route('GET', 'singleton')
  tellHello(ctx: RequestContext) {
    ctx.nodeRes.end('Hello World!\n');
  }
}
