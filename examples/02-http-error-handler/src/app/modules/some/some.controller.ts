import { RequestContext, Res, controller, route } from '@ditsmod/rest';

@controller()
export class SomeController {
  @route('GET', 'hello')
  ok(res: Res) {
    res.send('Hello, World!');
  }

  @route('GET', 'throw-error')
  throwError() {
    throw new Error('Here some error occurred');
  }
}

@controller({ scope: 'ctx' })
export class SomeCtxController {
  @route('GET', 'hello2')
  ok(ctx: RequestContext) {
    ctx.send('Hello, World2!');
  }

  @route('GET', 'throw-error2')
  throwError() {
    throw new Error('Here some error2 occurred');
  }
}
