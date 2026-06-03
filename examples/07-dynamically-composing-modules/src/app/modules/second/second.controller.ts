import { RequestContext, controller, route } from '@ditsmod/rest';

@controller()
export class SecondController {
  @route('GET', 'get-2')
  async tellHello(ctx: RequestContext) {
    ctx.send('second module.\n');
  }
}
