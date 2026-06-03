import { RequestContext, controller, route } from '@ditsmod/rest';

@controller()
export class HelloWorldController {
  @route('GET')
  tellHello(ctx: RequestContext) {
    ctx.send('Hello, World!\n');
  }
}
