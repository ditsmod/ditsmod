import { controller, route, SingletonRequestContext } from '@ditsmod/core';

@controller({ isSingleton: true })
export class SingletonController {
  @route('GET', 'singleton')
  tellHello(ctx: SingletonRequestContext) {
    ctx.nodeRes.end('Hello, you need send POST request');
  }

  @route('POST', 'singleton')
  post(ctx: SingletonRequestContext) {
    ctx.nodeRes.setHeader('Content-Type', 'application/json; charset=utf-8');
    ctx.nodeRes.end(JSON.stringify(ctx.body));
  }
}
