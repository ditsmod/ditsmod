import { controller, route, SingletonRequestContext } from '@ditsmod/core';

@controller({ isSingleton: true })
export class SingletonController {
  @route('GET', 'singleton')
  tellHello(ctx: SingletonRequestContext) {
    ctx.send('Hello, you need send POST request');
  }

  @route('POST', 'singleton')
  post(ctx: SingletonRequestContext) {
    ctx.sendJson(ctx.body);
  }
}
