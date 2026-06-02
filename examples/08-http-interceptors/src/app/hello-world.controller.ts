import { RequestContext, controller, route } from '@ditsmod/rest';

@controller()
export class HelloWorldController {
  @route('GET')
  tellHello(reqCtx: RequestContext) {
    return 'Original message!';
  }

  @route('GET', 'throw-error')
  throwError() {
    throw new Error('some error here!');
  }
}

@controller({ scope: 'route' })
export class HelloWorldController2 {
  @route('GET', 'route-scoped')
  tellHello(reqCtx: RequestContext) {
    return 'Original message!';
  }
}
