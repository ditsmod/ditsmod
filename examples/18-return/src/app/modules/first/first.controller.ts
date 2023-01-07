import { controller, RequestContext, route } from '@ditsmod/core';

@controller()
export class FirstController {
  @route('GET', 'first')
  tellHello(ctx: RequestContext) {
    ctx.res.send('first module.\n');
  }

  @route('GET', 'first-return')
  tellHelloWithReturn() {
    // This method not works because in this module not imported ReturnModule
    return 'first module.\n';
  }
}
