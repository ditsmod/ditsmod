import { controller, route, SingletonRequestContext } from '@ditsmod/core';

@controller({ isSingleton: true })
export class HelloWorldController2 {
  @route('GET', 'hello2')
  tellHello(ctx: SingletonRequestContext) {
    ctx.nodeRes.setHeader('Content-Type', 'text/plain; charset=utf-8');
    ctx.nodeRes.end('Hello, World!');
  }
}
