import { controller, SingletonRequestContext } from '@ditsmod/core';
import { route } from '@ditsmod/routing';

@controller({ scope: 'module' })
export class HelloWorldController2 {
  @route('GET', 'hello2')
  tellHello(ctx: SingletonRequestContext) {
    ctx.send('Hello, World!');
  }
}
