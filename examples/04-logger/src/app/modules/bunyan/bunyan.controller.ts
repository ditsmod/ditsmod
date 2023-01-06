import { controller, RequestContext, Res, route } from '@ditsmod/core';
import BunyanLogger from 'bunyan';

@controller()
export class BunyanController {
  constructor(private logger: BunyanLogger) {}

  @route('GET', 'bunyan')
  ok(ctx: RequestContext) {
    ctx.res.send('see console of node process\n');
    this.logger.info("it's works!");
  }
}
