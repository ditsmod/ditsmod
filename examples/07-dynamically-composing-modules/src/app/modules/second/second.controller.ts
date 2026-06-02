import { RequestContext, controller, route } from '@ditsmod/rest';

@controller()
export class SecondController {
  @route('GET', 'get-2')
  async tellHello(reqCtx: RequestContext) {
    reqCtx.send('second module.\n');
  }
}
