import { controller, RequestContext, route } from '@ditsmod/rest';

@controller()
export class Controller1 {
  @route('GET', 'ok1')
  ok(reqCtx: RequestContext) {
    reqCtx.send('ok1');
  }
}

@controller({ scope: 'route' })
export class Controller2 {
  @route('GET', 'ok2')
  ok(reqCtx: RequestContext) {
    reqCtx.send('ok2');
  }
}
