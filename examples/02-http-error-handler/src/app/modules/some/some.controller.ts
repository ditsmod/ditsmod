import { RequestContext, controller, route } from '@ditsmod/rest';

@controller()
export class RequestScopedController {
  @route('GET', 'hello')
  ok(ctx: RequestContext) {
    ctx.send('Hello, World!');
  }

  @route('GET', 'throw-error')
  throwError() {
    throw new Error('Here some error occurred');
  }
}

@controller({ scope: 'route' })
export class RouteScopedController {
  @route('GET', 'hello2')
  ok(ctx: RequestContext) {
    ctx.send('Hello, World2!');
  }

  @route('GET', 'throw-error2')
  throwError() {
    throw new Error('Here some error2 occurred');
  }
}
