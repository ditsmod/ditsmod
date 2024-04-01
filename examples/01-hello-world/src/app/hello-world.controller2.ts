import { controller, route, SingletonRequestContext } from '@ditsmod/core';

@controller({ isSingleton: true })
export class HelloWorldController2 {
  @route('GET', 'hello2')
  tellHello(ctx: SingletonRequestContext) {
    ctx.send('Hello, World!');
  }
}
