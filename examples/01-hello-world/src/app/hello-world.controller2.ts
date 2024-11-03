import { controller, route, SingletonRequestContext } from '@ditsmod/core';

@controller({ singleton: 'module' })
export class HelloWorldController2 {
  @route('GET', 'hello2')
  tellHello(ctx: SingletonRequestContext) {
    ctx.send('Hello, World!');
  }
}
