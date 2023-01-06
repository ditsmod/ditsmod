import { controller, Logger, RequestContext, Res, route } from '@ditsmod/core';

@controller()
export class SomeController {
  constructor(private logger: Logger) {}

  @route('GET')
  ok(ctx: RequestContext) {
    ctx.res.send('ok');
    this.logger.info("it's works!");
  }
}
