import { controller, RequestContext, route } from '@ditsmod/core';

@controller()
export class HelloWorldController {
  @route('GET')
  tellHello(ctx: RequestContext) {
    ctx.res.send('Hello World!\n');
  }
}
