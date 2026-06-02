import { RequestContext, controller, route } from '@ditsmod/rest';

@controller()
export class HelloWorldController {
  @route('GET')
  tellHello(reqCtx: RequestContext) {
    reqCtx.send('Hello, World!\n');
  }
}
